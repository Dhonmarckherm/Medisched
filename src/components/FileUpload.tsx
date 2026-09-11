"use client";

import { useState, useRef } from "react";
import { UploadIcon, XIcon, FileIcon } from "@/components/Icons";

interface FileUploadProps {
  onFileSelect: (file: File | null, url?: string) => void;
  accept?: string;
  maxSize?: number; // in MB
  label?: string;
  currentFile?: string | null;
}

export default function FileUpload({
  onFileSelect,
  accept = "image/jpeg,image/png,image/webp,application/pdf",
  maxSize = 5,
  label = "Attach File",
  currentFile,
}: FileUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File) => {
    setError("");

    if (f.size > maxSize * 1024 * 1024) {
      setError(`File must be under ${ maxSize}MB`);
      return;
    }

    const allowed = accept.split(",").map((t) => t.trim());
    if (!allowed.includes(f.type)) {
      setError("Invalid file type. Use JPG, PNG, WebP, or PDF.");
      return;
    }

    setFile(f);

    // Generate preview for images
    if (f.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target?.result as string);
      reader.readAsDataURL(f);
    } else {
      setPreview(null);
    }

    onFileSelect(f);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  };

  const removeFile = () => {
    setFile(null);
    setPreview(null);
    setError("");
    if (inputRef.current) inputRef.current.value = "";
    onFileSelect(null);
  };

  return (
    <div className="w-full">
      <label className="block text-[13px] font-medium text-gray-600 mb-1.5">{label}</label>

      {!file && !currentFile ? (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
            dragOver ? "border-primary bg-primary/5" : "border-gray-200 hover:border-gray-300 hover:bg-gray-50/50"
          }`}
        >
          <UploadIcon size={24} className={`mx-auto mb-2 ${dragOver ? "text-primary" : "text-gray-300"}`} />
          <p className="text-[13px] text-gray-500 m-0">
            <span className="text-primary font-medium">Click to upload</span> or drag and drop
          </p>
          <p className="text-[11px] text-gray-400 m-0 mt-1">
            JPG, PNG, WebP, or PDF (max {maxSize}MB)
          </p>
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            onChange={handleChange}
            className="hidden"
          />
        </div>
      ) : (
        <div className="border border-gray-200 rounded-xl p-3 flex items-center gap-3 bg-gray-50/50">
          {preview ? (
            <img src={preview} alt="Preview" className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
          ) : (
            <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
              <FileIcon size={20} className="text-blue-500" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-medium text-[#111] m-0 truncate">
              {file?.name || currentFile}
            </p>
            <p className="text-[11px] text-gray-400 m-0 mt-0.5">
              {file ? `${(file.size / 1024).toFixed(1)} KB` : "Current file"}
            </p>
          </div>
          <button
            type="button"
            onClick={removeFile}
            className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-400 hover:text-red-500 hover:border-red-200 transition cursor-pointer flex-shrink-0"
          >
            <XIcon size={14} />
          </button>
        </div>
      )}

      {error && (
        <p className="text-[12px] text-red-500 mt-1.5 m-0">{error}</p>
      )}
    </div>
  );
}
