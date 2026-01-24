import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import Papa from "papaparse";
import * as XLSX from "xlsx";

import { WorkflowType, WorkflowData, ParsedResult, RawCSVRow } from "@/app/types/workflow";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export const generateUUID = () => crypto.randomUUID();

function normalizeHeader(header: string): string {
  return header.trim().toLowerCase().replace(/\s+/g, '_');
}

function parseNumber(value: any, fieldName: string): number {
  if (value === null || value === undefined || value === '') {
    throw new Error(`Missing value for ${fieldName}`);
  }
  const num = typeof value === 'number' ? value : parseFloat(String(value).trim());
  if (isNaN(num) || num < 0) {
    throw new Error(`Invalid ${fieldName}: ${value}`);
  }
  return num;
}

function validateWorkflowType(type: string): WorkflowType {
  const normalizedKey = type.trim().replace(/\s+/g, '_').toLowerCase();

  const valueMap: Record<string, WorkflowType> = {
    deployments: "deployments",
    deploy: "deployments",
    pull_requests: "pull_requests",
    pullrequests: "pull_requests",
    tasks: "tasks",
    incidents: "tasks",
    build_failures: "build_failures",
    buildfailures: "build_failures",
    reviews: "reviews",
  };

  const mapped = valueMap[normalizedKey];
  const validTypes: WorkflowType[] = [
    "deployments",
    "pull_requests",
    "build_failures",
    "tasks",
    "reviews",
  ];

  if (!mapped || !validTypes.includes(mapped)) {
    throw new Error(`Invalid workflow type: ${type}. Must be one of: ${validTypes.join(', ')}`);
  }

  return mapped;
}

function calculateCost(row: RawCSVRow, type: WorkflowType, hourlyCost: number): number {
  try {
    switch (type) {
      case 'deployments': {
        const failedMinutes = parseNumber(row.failed_minutes, 'failed_minutes');
        const retryCount = parseNumber(row.retry_count, 'retry_count');
        return (failedMinutes / 60) * retryCount * hourlyCost;
      }

      case 'build_failures': {
        const failedTime = parseNumber(row.failed_time, 'failed_time');
        const retryCount = parseNumber(row.retry_count, 'retry_count');
        return failedTime * retryCount * hourlyCost;
      }

      case 'pull_requests': {
        const reviewDelayHours = parseNumber(row.review_delay_hours, 'review_delay_hours');
        const reviewersCount = parseNumber(row.reviewers_count, 'reviewers_count');
        return reviewDelayHours * reviewersCount * hourlyCost;
      }

      case 'tasks': {
        const blockedDays = parseNumber(row.blocked_days, 'blocked_days');
        return blockedDays * 8 * hourlyCost;
      }

      case 'reviews': {
        const reviewDelayHours = parseNumber(row.review_delay_hours, 'review_delay_hours');
        const reviewersCount = parseNumber(row.reviewers_count, 'reviewers_count');
        return reviewDelayHours * reviewersCount * hourlyCost;
      }

      default:
        throw new Error(`Unsupported workflow type: ${type}`);
    }
  } catch (error) {
    throw new Error(`Cost calculation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

function validateRequiredFields(row: RawCSVRow, type: WorkflowType): void {
  const commonFields = ['type', 'name'];
  
  const typeSpecificFields: Record<WorkflowType, string[]> = {
    deployments: ['failed_minutes', 'retry_count'],
    build_failures: ['failed_time', 'retry_count'],
    pull_requests: ['review_delay_hours', 'reviewers_count'],
    tasks: ['blocked_days'],
    reviews: ['review_delay_hours', 'reviewers_count'],
  };

  const requiredFields = [...commonFields, ...typeSpecificFields[type]];

  for (const field of requiredFields) {
    if (!row[field] && row[field] !== 0) {
      throw new Error(`Missing required field: ${field}`);
    }
  }
}

function parseRow(row: RawCSVRow, index: number, globalHourlyCost: number): WorkflowData {
  try {
    if (!row.type) throw new Error('Missing required field: type');
    if (!row.name) throw new Error('Missing required field: name');

    const type = validateWorkflowType(String(row.type));
    validateRequiredFields(row, type);
    
    const hourlyCost = row.hourly_cost 
      ? parseNumber(row.hourly_cost, 'hourly_cost')
      : globalHourlyCost;

    if (hourlyCost <= 0) {
      throw new Error('Hourly cost must be greater than 0');
    }

    const calculatedCost = calculateCost(row, type, hourlyCost);

    const baseData = {
      id: `${type}_${index}_${Date.now()}`,
      type,
      name: String(row.name).trim(),
      date: row.date ? String(row.date).trim() : new Date().toISOString(),
      hourlyCost: parseFloat(hourlyCost.toFixed(2)),
      calculatedCost: parseFloat(calculatedCost.toFixed(2))
    };

    switch (type) {
      case 'deployments':
        return {
          ...baseData,
          type: 'deployments',
          failedMinutes: parseNumber(row.failed_minutes, 'failed_minutes'),
          retryCount: parseNumber(row.retry_count, 'retry_count')
        };

      case 'build_failures':
        return {
          ...baseData,
          type: 'build_failures',
          failedTime: parseNumber(row.failed_time, 'failed_time'),
          retryCount: parseNumber(row.retry_count, 'retry_count')
        };

      case 'pull_requests':
        return {
          ...baseData,
          type: 'pull_requests',
          reviewDelayHours: parseNumber(row.review_delay_hours, 'review_delay_hours'),
          reviewersCount: parseNumber(row.reviewers_count, 'reviewers_count')
        };

      case 'tasks':
        return {
          ...baseData,
          type: 'tasks',
          blockedDays: parseNumber(row.blocked_days, 'blocked_days')
        };

      case 'reviews':
        return {
          ...baseData,
          type: 'reviews',
          reviewDelayHours: parseNumber(row.review_delay_hours, 'review_delay_hours'),
          reviewersCount: parseNumber(row.reviewers_count, 'reviewers_count')
        };

      default:
        throw new Error(`Unsupported workflow type: ${type}`);
    }
  } catch (error) {
    throw new Error(`Row ${index + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

function normalizeRows(rows: any[]): RawCSVRow[] {
  if (!rows || rows.length === 0) return [];

  const firstRow = rows[0];
  if (!firstRow || typeof firstRow !== 'object') return [];

  const headerMap: Record<string, string> = {};
  Object.keys(firstRow).forEach(key => {
    headerMap[key] = normalizeHeader(key);
  });

  return rows.map(row => {
    const normalizedRow: RawCSVRow = {};
    Object.keys(row).forEach(key => {
      const normalizedKey = headerMap[key];
      normalizedRow[normalizedKey] = row[key];
    });
    return normalizedRow;
  });
}

export function parseCSV(file: File, globalHourlyCost: number): Promise<ParsedResult> {
  return new Promise((resolve) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
      transformHeader: (header: string) => normalizeHeader(header),
      complete: (results: any) => {
        try {
          if (!results.data || results.data.length === 0) {
            return resolve({
              success: false,
              error: 'CSV file is empty or invalid'
            });
          }

          const rows = results.data as RawCSVRow[];
          const parsedData: WorkflowData[] = [];
          const errors: string[] = [];

          rows.forEach((row, index) => {
            try {
              const parsed = parseRow(row, index, globalHourlyCost);
              parsedData.push(parsed);
            } catch (error) {
              errors.push(error instanceof Error ? error.message : `Row ${index + 1}: Unknown error`);
            }
          });

          if (parsedData.length === 0) {
            return resolve({
              success: false,
              error: `Failed to parse any rows. Errors: ${errors.join('; ')}`
            });
          }

          parsedData.sort((a, b) => b.calculatedCost - a.calculatedCost);

          const totalCost = parsedData.reduce((sum, item) => sum + item.calculatedCost, 0);

          resolve({
            success: true,
            data: parsedData,
            totalCost: parseFloat(totalCost.toFixed(2)),
            rowsProcessed: parsedData.length,
            rowsFailed: errors.length
          });
        } catch (error) {
          resolve({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to parse CSV'
          });
        }
      },
      error: (error: any) => {
        resolve({
          success: false,
          error: `CSV parsing error: ${error.message}`
        });
      }
    });
  });
}

export async function parseXLSX(file: File, globalHourlyCost: number): Promise<ParsedResult> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });

    const firstSheetName = workbook.SheetNames[0];
    if (!firstSheetName) {
      return {
        success: false,
        error: 'Excel file has no sheets'
      };
    }

    const worksheet = workbook.Sheets[firstSheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
      defval: '',
      raw: false 
    });

    if (!jsonData || jsonData.length === 0) {
      return {
        success: false,
        error: 'Excel sheet is empty'
      };
    }

    const normalizedRows = normalizeRows(jsonData);

    const parsedData: WorkflowData[] = [];
    const errors: string[] = [];

    normalizedRows.forEach((row, index) => {
      try {
        const parsed = parseRow(row, index, globalHourlyCost);
        parsedData.push(parsed);
      } catch (error) {
        errors.push(error instanceof Error ? error.message : `Row ${index + 1}: Unknown error`);
      }
    });

    if (parsedData.length === 0) {
      return {
        success: false,
        error: `Failed to parse any rows. Errors: ${errors.join('; ')}`
      };
    }

    parsedData.sort((a, b) => b.calculatedCost - a.calculatedCost);

    const totalCost = parsedData.reduce((sum, item) => sum + item.calculatedCost, 0);

    return {
      success: true,
      data: parsedData,
      totalCost: parseFloat(totalCost.toFixed(2)),
      rowsProcessed: parsedData.length,
      rowsFailed: errors.length
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to parse Excel file'
    };
  }
}

export async function parseWorkflowFile(file: File, globalHourlyCost: number): Promise<ParsedResult> {
  if (!file) {
    return {
      success: false,
      error: 'No file provided'
    };
  }

  if (globalHourlyCost <= 0) {
    return {
      success: false,
      error: 'Hourly cost must be greater than 0'
    };
  }

  const fileName = file.name.toLowerCase();
  const fileExtension = fileName.split('.').pop();

  if (fileExtension === 'csv') {
    return parseCSV(file, globalHourlyCost);
  } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
    return parseXLSX(file, globalHourlyCost);
  } else {
    return {
      success: false,
      error: `Unsupported file type: ${fileExtension}. Please upload a CSV or Excel file.`
    };
  }
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

export function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  } catch {
    return dateString;
  }
}

export function getWorkflowTypeLabel(type: WorkflowType): string {
  const labels: Record<WorkflowType, string> = {
    deployments: 'Deployments',
    pull_requests: 'Pull Requests',
    build_failures: 'Build Failures',
    tasks: 'Tasks',
    reviews: 'Reviews'
  };
  return labels[type] || type;
}