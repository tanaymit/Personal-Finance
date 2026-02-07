'use client';

import { useState, useCallback } from 'react';
import { Upload, X } from 'lucide-react';

interface DropZoneProps {
  onFilesSelected: (files: File[]) => void;
  accept?: string;
  maxSize?: number; // in bytes
}

export function DropZone({
  onFilesSelected,
  accept = '.pdf,.jpg,.jpeg,.png',
  maxSize = 5 * 1024 * 1024 // 5MB default
}: DropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const validateFiles = (files: File[]): boolean => {
    setError(null);

    if (files.length === 0) {
      setError('No files selected');
      return false;
    }

    for (const file of files) {
      if (file.size > maxSize) {
        setError(`File ${file.name} is too large (max ${maxSize / 1024 / 1024}MB)`);
        return false;
      }
    }

    return true;
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (validateFiles(files)) {
      onFilesSelected(files);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files ? Array.from(e.currentTarget.files) : [];
    if (validateFiles(files)) {
      onFilesSelected(files);
    }
  };

  return (
    <div
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
        isDragging
          ? 'border-blue-500 bg-blue-50'
          : 'border-slate-300 bg-slate-50 hover:border-slate-400'
      }`}
    >
      <input
        type="file"
        multiple
        onChange={handleInputChange}
        accept={accept}
        className="hidden"
        id="file-input"
      />

      <label htmlFor="file-input" className="cursor-pointer">
        <div className="flex justify-center mb-4">
          <div className="p-4 bg-blue-100 rounded-full">
            <Upload size={32} className="text-blue-600" />
          </div>
        </div>
        <h3 className="text-lg font-semibold text-slate-900 mb-1">
          Upload Receipt
        </h3>
        <p className="text-slate-600 text-sm mb-2">
          Drag and drop your receipt here, or click to select
        </p>
        <p className="text-xs text-slate-500">
          Accepted formats: PDF, JPG, PNG (Max {maxSize / 1024 / 1024}MB)
        </p>
      </label>

      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
          <X size={16} className="text-red-600" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
    </div>
  );
}
