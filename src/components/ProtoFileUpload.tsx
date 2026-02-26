'use client';

import { useState, useCallback } from 'react';
import protobuf from 'protobufjs';

interface ProtoFileUploadProps {
  onFileLoaded?: (content: string, parsed: any) => void;
}

export default function ProtoFileUpload({ onFileLoaded }: ProtoFileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleFile = useCallback(async (file: File) => {
    if (!file.name.endsWith('.proto')) {
      setError('Please select a .proto file');
      return;
    }

    setIsLoading(true);
    setError(null);
    setFileName(file.name);

    try {
      const content = await file.text();
      
      // Parse the proto file using protobuf.js
      const root = protobuf.parse(content);
      
      // Convert to JSON for display
      const parsed = root.root.toJSON();
      
      onFileLoaded?.(content, parsed);
    } catch (err) {
      setError(`Error parsing proto file: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  }, [onFileLoaded]);

  const onDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFile(files[0]);
    }
  }, [handleFile]);

  const onDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const onFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  }, [handleFile]);

  return (
    <div className="w-full max-w-md mx-auto">
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragging
            ? 'border-blue-500 bg-blue-50'
            : error
            ? 'border-red-500 bg-red-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
      >
        {isLoading ? (
          <div className="space-y-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            <p className="text-gray-600">Parsing proto file...</p>
          </div>
        ) : (
          <>
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              stroke="currentColor"
              fill="none"
              viewBox="0 0 48 48"
            >
              <path
                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <div className="space-y-2">
              <p className="text-lg font-medium text-gray-900">
                Drop your .proto file here
              </p>
              <p className="text-sm text-gray-500">
                or{' '}
                <label htmlFor="file-input" className="font-medium text-blue-600 hover:text-blue-500 cursor-pointer">
                  browse to upload
                </label>
              </p>
              {fileName && (
                <p className="text-sm text-green-600">
                  Loaded: {fileName}
                </p>
              )}
              {error && (
                <p className="text-sm text-red-600">
                  {error}
                </p>
              )}
            </div>
          </>
        )}
      </div>
      
      <input
        id="file-input"
        type="file"
        accept=".proto"
        onChange={onFileInputChange}
        className="hidden"
      />
    </div>
  );
}