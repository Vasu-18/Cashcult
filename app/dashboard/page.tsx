import React from "react";
import Header from "../components/Header";
import { createPublicClient } from "@/lib/appwrite";
import { appwriteConfig } from "@/lib/appwrite/config";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { Rings } from "../components/design/Header";
import Image from "next/image";
import background from '@/assets/gradient.png'

interface UploadDoc {
  $id: string;
  teamName?: string;
  workflowType?: string;
  averageHourlyCost?: number;
  fileId?: string;
  fileName?: string;
  totalCost?: number;
  rowsProcessed?: number;
  rowsFailed?: number;
  $createdAt?: string;
  $sequence?: number;
  $collectionId?: string;
  $databaseId?: string;
  $updatedAt?: string;
  $permissions?: string[];
}

interface UploadWithData extends UploadDoc {
  rows?: Record<string, any>[];
  parseError?: string;
  calculatedTotalCost?: number;
  highestCost?: number;
  sortedRows?: Array<Record<string, any> & { calculatedCost: number }>;
}

function calculateRowCost(
  workflowType: string,
  row: Record<string, any>,
  hourlyCost: number
): number {
  const type = workflowType.toLowerCase().replace(/\s+/g, '_');

  switch (type) {
    case "pull_requests":
      return Number(row.review_delay_hours || 0) * Number(row.reviewers_count || 1) * hourlyCost;

    case "deployments":
      return (Number(row.failed_minutes || 0) / 60) * Number(row.retry_count || 1) * hourlyCost;

    case "build_failures":
      return Number(row.failed_time || 0) * Number(row.retry_count || 1) * hourlyCost;

    case "tasks":
      return Number(row.blocked_days || 0) * 8 * hourlyCost;

    default:
      return 0;
  }
}

async function getUploads(): Promise<UploadDoc[]> {
  try {
    const { databases } = await createPublicClient();
    const res = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.collectionId,
      []
    );
    return (res as any).documents || [];
  } catch (error) {
    console.error("Failed to fetch uploads", error);
    return [];
  }
}

async function parseFileFromStorage(fileId: string) {
  try {
    const { storage } = await createPublicClient();

    const fileMeta = await storage.getFile(appwriteConfig.bucketId, fileId);
    const fileName = fileMeta.name;
    const ext = fileName.split(".").pop()?.toLowerCase();

    const buffer: ArrayBuffer = await storage.getFileDownload(
      appwriteConfig.bucketId,
      fileId
    );

    if (ext === "csv") {
      const text = new TextDecoder("utf-8").decode(buffer);
      const parsed = Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header: string) => header.trim().toLowerCase().replace(/\s+/g, '_')
      });

      if (parsed.errors.length) {
        throw new Error(parsed.errors.map((e: any) => e.message).join("; "));
      }

      return { rows: parsed.data, fileName };
    }

    if (ext === "xlsx" || ext === "xls") {
      const workbook = XLSX.read(buffer, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      if (!sheetName) throw new Error("No sheet found");

      const rawRows = XLSX.utils.sheet_to_json<Record<string, any>>(
        workbook.Sheets[sheetName],
        { defval: "", raw: false }
      );

      const rows = rawRows.map(row => {
        const normalized: Record<string, any> = {};
        Object.keys(row).forEach(key => {
          const normalizedKey = key.trim().toLowerCase().replace(/\s+/g, '_');
          normalized[normalizedKey] = row[key];
        });
        return normalized;
      });

      return { rows, fileName };
    }

    throw new Error(`Unsupported file type: ${ext}`);
  } catch (error) {
    console.error('Parse error:', error);
    throw error;
  }
}

const InsightsPage = async () => {
  const uploads = await getUploads();

  const uploadsWithData: UploadWithData[] = await Promise.all(
    uploads.map(async (item) => {
      if (!item.fileId) {
        return { ...item, parseError: "No file attached" };
      }

      try {
        const { rows, fileName } = await parseFileFromStorage(item.fileId);

        let calculatedTotalCost = 0;
        let highestCost = 0;
        const sortedRows: Array<Record<string, any> & { calculatedCost: number }> = [];

        if (rows && rows.length > 0 && item.workflowType && item.averageHourlyCost) {
          rows.forEach((row: Record<string, any>) => {
            const cost = calculateRowCost(
              item.workflowType!,
              row,
              item.averageHourlyCost!
            );
            calculatedTotalCost += cost;
            highestCost = Math.max(highestCost, cost);
            sortedRows.push({ ...row, calculatedCost: cost });
          });

          sortedRows.sort((a, b) => b.calculatedCost - a.calculatedCost);
        }

        return {
          ...item,
          fileName,
          rows,
          sortedRows,
          calculatedTotalCost,
          highestCost,
        };
      } catch (err) {
        return {
          ...item,
          parseError:
            err instanceof Error ? err.message : "Failed to parse file",
        };
      }
    })
  );

  return (
    <div className="min-h-screen bg-[#0E0C15] text-white">
      <Header />

      <div className="relative">
        <Image
          src={background}
          alt='bg'
          className='absolute top-15 left-0 h-full w-full object-cover opacity-20'
        />

        <main className="container mx-auto px-6 pb-16 pt-28">
          <div className="mb-10">
            <h1 className="text-4xl font-semibold tracking-tight">
             Your dashboard
            </h1>
            <p className="mt-3 max-w-2xl text-[#ADA8C3]">
              Analyze all uploaded workflows in one place. Explore detailed records,
              cost impact, and prioritize what matters most.
            </p>
          </div>

          {uploadsWithData.length === 0 ? (
            <div className="text-center py-12 text-[#ADA8C3]">
              No uploads found.
            </div>
          ) : (
            <div className="space-y-15">
              {uploadsWithData.map((item) => (
                <div
                  key={item.$id}
                  className="rounded-lg border-4 border-yellow-600 bg-black p-6"
                >
                  <div className="mb-6 pb-4 border-b border-white/10">
                    <h2 className="text-3xl font-semibold mb-7">
                      Hi, {item.teamName || "Unnamed Team"} 👋
                    </h2>

                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 text-sm">
                      <div>
                        <span className="text-[#ADA8C3]">Workflow Type</span>
                        <p className="mt-1 font-medium text-2xl">
                          {item.workflowType?.replace(/_/g, ' ') || "—"}
                        </p>
                      </div>

                      <div>
                        <span className="text-[#ADA8C3]">File Name</span>
                        <p className="mt-1 font-medium text-xl" title={item.fileName}>
                          {item.fileName || "—"}
                        </p>
                      </div>

                      <div>
                        <span className="text-[#ADA8C3]">Hourly Cost</span>
                        <p className="mt-1 font-medium text-4xl">
                          ${item.averageHourlyCost?.toFixed(2) || "0.00"}
                        </p>
                      </div>

                      <div>
                        <span className="text-[#ADA8C3]">Total Cost Impact</span>
                        <p className="mt-1 font-medium text-green-400 text-4xl">
                          ${item.calculatedTotalCost?.toFixed(2) || "0.00"}
                        </p>
                      </div>

                      <div>
                        <span className="text-[#ADA8C3]">Highest Single Cost</span>
                        <p className="mt-1 font-medium text-red-400 text-4xl">
                          ${item.highestCost?.toFixed(2) || "0.00"}
                        </p>
                      </div>

                      <div>
                        <span className="text-[#ADA8C3]">Total Rows</span>
                        <p className="mt-1 font-medium text-4xl">
                          {item.rows?.length || 0}
                        </p>
                      </div>

                      <div>
                        <span className="text-[#ADA8C3]">Uploaded</span>
                        <p className="mt-1 font-medium text-4xl">
                          {item.$createdAt
                            ? new Date(item.$createdAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })
                            : "—"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {item.parseError && (
                    <div className="mb-4 rounded-lg bg-red-500/20 p-4 text-sm text-red-400">
                      <strong>Error:</strong> {item.parseError}
                    </div>
                  )}

                  {item.sortedRows && item.sortedRows.length > 0 ? (
                    <div className="overflow-x-auto">
                      <div className="mb-3 text-sm text-[#ADA8C3]">
                        Showing all {item.sortedRows.length} rows
                      </div>
                      <table className="min-w-full border border-white/10 text-sm">
                        <thead className="bg-purple-500 text-white">
                          <tr>
                            <th className="px-3 py-3 text-left font-semibold sticky left-0">
                              S.NO.
                            </th>
                            {Object.keys(item.sortedRows[0])
                              .filter(key => key !== 'calculatedCost')
                              .map((key) => (
                                <th key={key} className="px-3 py-3 text-left font-semibold whitespace-nowrap">
                                  {key.replace(/_/g, ' ').toUpperCase()}
                                </th>
                              ))}
                            <th className="px-3 py-3 text-left font-semibold whitespace-nowrap ">
                              CALCULATED COST
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {item.sortedRows.map((row, idx) => (
                            <tr
                              key={idx}
                              className="border-t border-white/5 hover:bg-white/10 transition-colors"
                            >
                              <td className="px-3 py-2 text-[#ADA8C3] font-medium sticky left-0 bg-[#0E0C15]">
                                {idx + 1}
                              </td>
                              {Object.keys(row)
                                .filter(key => key !== 'calculatedCost')
                                .map((key) => (
                                  <td key={key} className="px-3 py-2">
                                    {row[key] !== null && row[key] !== undefined && row[key] !== ''
                                      ? String(row[key])
                                      : "—"}
                                  </td>
                                ))}
                              <td className="px-3 py-2 font-semibold text-green-400">
                                ${row.calculatedCost.toFixed(2)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    !item.parseError && (
                      <div className="py-8 text-center text-n-3 text-sm">
                        No data available in this file.
                      </div>
                    )
                  )}
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default InsightsPage;