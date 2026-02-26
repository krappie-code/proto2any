'use client';

import { useState } from 'react';
import ProtoFileUpload from '@/components/ProtoFileUpload';

export default function Home() {
  const [protoContent, setProtoContent] = useState<string | null>(null);
  const [parsedProto, setParsedProto] = useState<any>(null);

  const handleFileLoaded = (content: string, parsed: any) => {
    setProtoContent(content);
    setParsedProto(parsed);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-4">
            Proto2Any
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Convert Protocol Buffer definitions to any format. 
            Upload your .proto files and generate code, documentation, or schemas.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Upload Section */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Upload Proto File
            </h2>
            <ProtoFileUpload onFileLoaded={handleFileLoaded} />
          </div>

          {/* Preview Section */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Proto Definition
            </h2>
            {protoContent ? (
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                  <pre className="text-sm text-gray-800 whitespace-pre-wrap">
                    {protoContent}
                  </pre>
                </div>
                {parsedProto && (
                  <details className="bg-blue-50 rounded-lg p-4">
                    <summary className="font-medium text-blue-900 cursor-pointer">
                      Parsed Structure (JSON)
                    </summary>
                    <pre className="text-sm text-blue-800 mt-2 whitespace-pre-wrap max-h-64 overflow-y-auto">
                      {JSON.stringify(parsedProto, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <svg
                  className="mx-auto h-12 w-12 text-gray-300 mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <p>Upload a .proto file to see its definition here</p>
              </div>
            )}
          </div>
        </div>

        {/* Future Features Preview */}
        <div className="mt-16">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Coming Soon
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow-md p-6 text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg mx-auto mb-4 flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Code Generation</h3>
              <p className="text-gray-600">Generate code in multiple languages from your proto definitions</p>
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-6 text-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg mx-auto mb-4 flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Documentation</h3>
              <p className="text-gray-600">Auto-generate beautiful documentation from your proto files</p>
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-6 text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg mx-auto mb-4 flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Schema Export</h3>
              <p className="text-gray-600">Export to JSON Schema, OpenAPI, and other formats</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}