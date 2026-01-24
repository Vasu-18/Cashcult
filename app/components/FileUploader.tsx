"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { formatSize } from "../../lib/utils";
import icon from "@/assets/excelsvg.svg"
import Image from "next/image";
import band from "@/assets/close.svg"
import upload from '@/assets/upload.png'

interface FileUploaderProps {
  onFileSelect?: (file: File | null) => void;
  maxSizeMB?: number;
}

const FileUploader = ({
  onFileSelect,
  maxSizeMB = 20,
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
      "text/csv": [".csv"],
      "application/vnd.ms-excel": [".csv", ".xls"],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
        ".xlsx",
      ],
    },
    });

  const handleRemoveFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedFile(null);
    onFileSelect?.(null);
  };

  return (
    <div className="w-full rounded-xl border border-dashed border-red-500 bg-black p-6">
      <div {...getRootProps()} className="cursor-pointer text-center">
        <input {...getInputProps()} />

        {!selectedFile ? (
          <div>
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
              <Image
                src={upload}
                alt="upload"
                className="h-9 w-9"
              />
            </div>

            <p className="text-sm text-purple-400">
              <span className="font-medium text-yellow-600">
                Click to upload
              </span>{" "}
              or drag and drop
            </p>

            <p className="text-xs text-gray-500">
            
            </p>

            {isDragActive && (
              <p className="text-xs text-blue-600">
                Drop the file here…
              </p>
            )}
          </div>
        ) : (
          <div
            className="flex items-center justify-between rounded-lg border bg-gray-50 p-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <Image
                src={icon}
                alt="csv"
                className="h-8 w-8"
              />
              <div className="text-left">
                <p className="max-w-50 truncate text-sm font-medium text-gray-800">
                  {selectedFile.name}
                </p>
                <p className="text-xs text-gray-500">
                  {formatSize(selectedFile.size)}
                </p>
              </div>
            </div>

            <button
              className="rounded-md p-1 hover:bg-gray-200"
              onClick={handleRemoveFile}
            >
              <Image
                src={band}
                alt="remove"
                className="h-4 w-4"
              />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FileUploader;
