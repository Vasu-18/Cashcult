"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { formatSize } from "../../lib/utils";
import excelIcon from "@/assets/excelsvg.svg"
import pdfIcon from "@/assets/pdf_icon.png"
import Image from "next/image";
import band from "@/assets/close.svg"
import upload from '@/assets/upload.png'

interface FileUploaderProps {
  onFileSelect?: (file: File | null) => void;
  maxSizeMB?: number;
}

const FileUploader = ({
  onFileSelect,
  maxSizeMB = 10,
}: FileUploaderProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const maxFileSize = maxSizeMB * 1024 * 1024;

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0] ?? null;
      setSelectedFile(file);
      onFileSelect?.(file);
    },
    [onFileSelect]
  );

  const { getRootProps, getInputProps, isDragActive } =
    useDropzone({
      onDrop,
      multiple: false,
      maxSize: maxFileSize,
      accept: {
        "application/pdf": [".pdf"],
        "text/csv": [".csv"],
        "application/vnd.ms-excel": [".csv", ".xls"],
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
      },
    });

  const handleRemoveFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedFile(null);
    onFileSelect?.(null);
  };

  const isPdf = selectedFile?.name?.toLowerCase().endsWith(".pdf");
  const isCsv = selectedFile?.name?.toLowerCase().endsWith(".csv");
  const currentIcon = isPdf ? pdfIcon : excelIcon;

  return (
    <div
      className={`w-full rounded-2xl border-2 border-dashed transition-all duration-300 p-7 ${
        isDragActive
          ? "border-purple-400 bg-purple-400/5 shadow-[0_0_0_1px_rgba(168,85,247,0.4)]"
          : "border-white/10 bg-[#131920] hover:border-purple-400/60 hover:bg-[#151b26]"
      }`}
    >
      <div {...getRootProps()} className="cursor-pointer text-center">
        <input {...getInputProps()} />

        {!selectedFile ? (
          <div className="flex flex-col items-center gap-4">
            <div className="w-14 h-14 flex items-center justify-center rounded-2xl bg-white/[0.04] text-slate-400">
              <Image
                src={upload}
                alt="upload"
                className="h-6 w-6 opacity-60"
              />
            </div>

            <div className="space-y-1">
              <p className="text-sm text-white font-medium">
                Drop your <span className="text-purple-400">invoice file</span> here
              </p>
              <p className="text-[11px] text-slate-500">
                Drag & drop or click to browse · CSV, PDF, XLSX
              </p>
              <div className="flex items-center justify-center gap-2 text-[10px] text-slate-500 mt-1">
                <span className="inline-flex items-center gap-1 rounded-full bg-white/[0.03] px-2 py-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> CSV
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-white/[0.03] px-2 py-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400" /> PDF
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-white/[0.03] px-2 py-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-400" /> XLSX
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div
            className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] p-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  isPdf ? "bg-red-400/10" : "bg-emerald-400/10"
                }`}
              >
                <Image
                  src={currentIcon}
                  alt="file"
                  className={`${isPdf ? "h-6 w-6" : "h-5 w-5"}`}
                />
              </div>
              <div className="text-left">
                <p className="max-w-[180px] truncate text-[13px] font-bold text-white">
                  {selectedFile.name}
                </p>
                <p className="text-[11px] text-slate-500 flex items-center gap-1">
                  {formatSize(selectedFile.size)} ·{" "}
                  <span className="inline-flex items-center gap-1 text-emerald-400">
                    <span className="w-3 h-3 rounded-full border border-emerald-500 flex items-center justify-center">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    </span>
                    Ready to analyze
                  </span>
                </p>
              </div>
            </div>

            <button
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/[0.06] text-slate-500 hover:text-white transition-colors"
              onClick={handleRemoveFile}
            >
              <Image
                src={band}
                alt="remove"
                className="h-3.5 w-3.5 opacity-50 hover:opacity-100"
              />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FileUploader;
