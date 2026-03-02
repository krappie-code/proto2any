"use client";

import { useState, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import MonacoProtoEditor from "@/components/MonacoProtoEditor";
import type { MonacoProtoEditorRef } from "@/components/MonacoProtoEditor";
import { EXAMPLE_PROTO } from "@/lib/examples";
import { SUPPORTED_FORMATS, ConversionFormat, ConversionResult } from "@/lib/converters";
import type { editor } from "monaco-editor";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="h-full bg-[#1e1e1e] rounded-lg animate-pulse" />
  ),
});

export default function Home() {
  const [content, setContent] = useState(EXAMPLE_PROTO);
  const [selectedFormat, setSelectedFormat] = useState<ConversionFormat>('javascript');
  const [conversionResult, setConversionResult] = useState<ConversionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'formats' | 'output'>('formats');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<MonacoProtoEditorRef>(null);
  const outputEditorRef = useRef<MonacoProtoEditorRef>(null);

  const handleConvert = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/convert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, format: selectedFormat }),
      });
      const data = await res.json();
      setConversionResult(data);
      setActiveTab('output');
    } catch (error) {
      setConversionResult({
        success: false,
        format: selectedFormat,
        error: "Failed to convert proto file"
      });
    } finally {
      setLoading(false);
    }
  }, [content, selectedFormat]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith('.proto')) {
      file.text().then((text) => {
        setContent(text);
        // Auto-convert if format is selected and content exists
        if (selectedFormat && text.trim()) {
          setTimeout(() => {
            fetch("/api/convert", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ content: text, format: selectedFormat }),
            })
            .then(res => res.json())
            .then(data => {
              setConversionResult(data);
              setActiveTab('output');
            })
            .catch(() => {
              setConversionResult({
                success: false,
                format: selectedFormat,
                error: "Failed to convert proto file"
              });
            });
          }, 100);
        }
      });
    }
  }, [selectedFormat]);

  const handleFileUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file && file.name.endsWith('.proto')) {
        file.text().then((text) => {
          setContent(text);
          // Auto-convert if format is selected and content exists
          if (selectedFormat && text.trim()) {
            setTimeout(() => {
              fetch("/api/convert", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content: text, format: selectedFormat }),
              })
              .then(res => res.json())
              .then(data => {
                setConversionResult(data);
                setActiveTab('output');
              })
              .catch(() => {
                setConversionResult({
                  success: false,
                  format: selectedFormat,
                  error: "Failed to convert proto file"
                });
              });
            }, 100);
          }
        });
      }
    },
    [selectedFormat]
  );

  const copyToClipboard = useCallback((text: string) => {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    } else {
      // Fallback for non-HTTPS
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, []);

  const getOutputLanguage = (format: ConversionFormat): string => {
    switch (format) {
      case 'javascript': return 'javascript';
      case 'typescript': return 'typescript';
      case 'json-schema': return 'json';
      case 'python': return 'python';
      default: return 'text';
    }
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-[#1e1e2e]">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              proto2any
            </span>
            <span className="text-sm text-[#7a7a8c]">.com</span>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="https://protolint.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#7a7a8c] hover:text-white transition-colors text-sm"
            >
              protolint.com →
            </a>
            <a
              href="https://github.com/krappie-code/proto2any"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#7a7a8c] hover:text-white transition-colors text-sm"
            >
              GitHub →
            </a>
          </div>
        </div>
      </header>

      {/* Hero section */}
      <section className="max-w-7xl mx-auto px-4 py-16 text-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          Convert{" "}
          <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Protocol Buffers
          </span>
          {" "}to any format
        </h1>
        <p className="text-[#7a7a8c] text-lg max-w-2xl mx-auto mb-8">
          Transform your .proto files into JavaScript, TypeScript, JSON Schema, and more.
          Generate code, schemas, and documentation from your Protocol Buffer definitions.
        </p>
        <div className="text-sm text-[#7a7a8c]">
          Need to validate your proto files first?{" "}
          <a 
            href="https://protolint.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-purple-400 hover:text-purple-300 transition-colors"
          >
            Check them at protolint.com
          </a>
        </div>
      </section>

      {/* Editor + Results */}
      <section className="max-w-7xl mx-auto px-4 pb-16">
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Editor panel */}
          <div
            className="rounded-xl border border-[#1e1e2e] bg-[#12121a] overflow-hidden"
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#1e1e2e]">
              <span className="text-sm text-[#7a7a8c]">input.proto</span>
              <div className="flex gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".proto"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs px-3 py-1 rounded-md border border-[#1e1e2e] text-[#7a7a8c] hover:text-white hover:border-[#333] transition-colors"
                >
                  Upload
                </button>
                <select
                  value={selectedFormat}
                  onChange={(e) => {
                    const newFormat = e.target.value as ConversionFormat;
                    setSelectedFormat(newFormat);
                    // Auto-convert when format is selected
                    if (content.trim()) {
                      setTimeout(() => {
                        fetch("/api/convert", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ content, format: newFormat }),
                        })
                        .then(res => res.json())
                        .then(data => {
                          setConversionResult(data);
                          setActiveTab('output');
                        })
                        .catch(() => {
                          setConversionResult({
                            success: false,
                            format: newFormat,
                            error: "Failed to convert proto file"
                          });
                        });
                      }, 0);
                    }
                  }}
                  className="text-xs px-3 py-1 rounded-md border border-[#1e1e2e] bg-[#12121a] text-[#7a7a8c] hover:text-white hover:border-[#333] transition-colors"
                >
                  {SUPPORTED_FORMATS.map((format) => (
                    <option key={format.value} value={format.value}>
                      {format.label}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleConvert}
                  disabled={loading}
                  className="text-xs px-4 py-1 rounded-md bg-purple-600 hover:bg-purple-500 text-white font-medium transition-colors disabled:opacity-50"
                >
                  {loading ? "Converting…" : "Convert"}
                </button>
              </div>
            </div>
            <div className="relative">
              <MonacoProtoEditor
                ref={editorRef}
                value={content}
                onChange={setContent}
              />
              <button
                onClick={() => copyToClipboard(content)}
                className="absolute top-3 right-3 p-1.5 rounded-md bg-[#1e1e2e]/80 hover:bg-[#2a2a3e] text-[#7a7a8c] hover:text-white transition-all backdrop-blur-sm z-10"
                title="Copy to clipboard"
              >
                {copied ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-400">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                )}
              </button>
            </div>
            <p className="text-xs text-[#7a7a8c] px-4 py-2 border-t border-[#1e1e2e]">
              Drag & drop a .proto file or paste content above
            </p>
          </div>

          {/* Results panel */}
          <div className="rounded-xl border border-[#1e1e2e] bg-[#12121a] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#1e1e2e]">
              <div className="flex gap-4">
                <button
                  onClick={() => setActiveTab('formats')}
                  className={`text-sm transition-colors ${
                    activeTab === 'formats' 
                      ? 'text-purple-400 font-medium' 
                      : 'text-[#7a7a8c] hover:text-white'
                  }`}
                >
                  Formats
                </button>
                <button
                  onClick={() => setActiveTab('output')}
                  className={`text-sm transition-colors ${
                    activeTab === 'output' 
                      ? 'text-purple-400 font-medium' 
                      : 'text-[#7a7a8c] hover:text-white'
                  }`}
                >
                  Converted Code
                </button>
              </div>
              {conversionResult && (
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    conversionResult.success
                      ? "bg-green-400/10 text-green-400"
                      : "bg-red-400/10 text-red-400"
                  }`}
                >
                  {conversionResult.success ? "✓ Success" : "✕ Error"}
                </span>
              )}
            </div>
            
            <div className="flex-1 overflow-hidden max-h-[540px]">
              {activeTab === 'formats' && (
                <div className="p-4 h-full overflow-y-auto">
                  <div className="space-y-4">
                    <div className="text-sm text-[#7a7a8c] mb-4">
                      Select a format to automatically convert your proto file
                    </div>
                    {SUPPORTED_FORMATS.map((format) => (
                      <div
                        key={format.value}
                        className={`rounded-lg border p-4 cursor-pointer transition-all ${
                          selectedFormat === format.value
                            ? 'border-purple-400/30 bg-purple-400/5'
                            : 'border-[#1e1e2e] hover:border-[#333] hover:bg-[#0f0f15]'
                        }`}
                        onClick={() => setSelectedFormat(format.value)}
                      >
                        <h3 className="font-medium text-sm mb-1">{format.label}</h3>
                        <p className="text-[#7a7a8c] text-xs">{format.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {activeTab === 'output' && (
                <div className="h-full">
                  {!conversionResult && (
                    <div className="flex items-center justify-center h-full text-[#7a7a8c] text-sm">
                      Convert your proto file to see the output here
                    </div>
                  )}
                  
                  {conversionResult && !conversionResult.success && (
                    <div className="p-4 h-full flex items-center justify-center">
                      <div className="text-center">
                        <span className="text-4xl mb-2 block">❌</span>
                        <span className="text-red-400 font-medium block mb-2">Conversion Failed</span>
                        <span className="text-[#7a7a8c] text-sm">{conversionResult.error}</span>
                      </div>
                    </div>
                  )}
                  
                  {conversionResult && conversionResult.success && conversionResult.output && (
                    <div className="relative h-full">
                      <div className="h-full">
                        <MonacoEditor
                          height="100%"
                          language={getOutputLanguage(selectedFormat)}
                          theme="vs-dark"
                          value={conversionResult.output}
                          options={{
                            readOnly: true,
                            minimap: { enabled: false },
                            fontSize: 13,
                            lineNumbers: "on",
                            scrollBeyondLastLine: false,
                            padding: { top: 12 },
                            wordWrap: "on",
                          }}
                        />
                      </div>
                      <button
                        onClick={() => copyToClipboard(conversionResult.output || '')}
                        className="absolute top-3 right-3 p-1.5 rounded-md bg-[#1e1e2e]/80 hover:bg-[#2a2a3e] text-[#7a7a8c] hover:text-white transition-all backdrop-blur-sm z-10"
                        title="Copy output to clipboard"
                      >
                        {copied ? (
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-400">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2 2v1" />
                          </svg>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* API Documentation */}
      <section className="border-t border-[#1e1e2e] py-20">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-center mb-8">API</h2>
          <p className="text-[#7a7a8c] text-center mb-8">
            Integrate proto2any into your development workflow or CI/CD pipeline.
          </p>
          <div className="rounded-xl border border-[#1e1e2e] bg-[#12121a] overflow-hidden">
            <div className="px-4 py-3 border-b border-[#1e1e2e]">
              <span className="text-sm font-mono">
                POST /api/convert
              </span>
            </div>
            <pre className="p-4 text-sm overflow-x-auto text-[#7a7a8c]">
{`# JSON body
curl -X POST https://proto2any.com/api/convert \\
  -H "Content-Type: application/json" \\
  -d '{"content": "syntax = \\"proto3\\";\\npackage example;", "format": "javascript"}'

# File upload
curl -X POST https://proto2any.com/api/convert \\
  -F "file=@path/to/your.proto" \\
  -F "format=typescript"`}
            </pre>
          </div>
          <div className="mt-6 rounded-xl border border-[#1e1e2e] bg-[#12121a] overflow-hidden">
            <div className="px-4 py-3 border-b border-[#1e1e2e]">
              <span className="text-sm font-mono text-[#7a7a8c]">Response</span>
            </div>
            <pre className="p-4 text-sm overflow-x-auto text-[#7a7a8c]">
{`{
  "success": true,
  "format": "javascript",
  "output": "/**\\n * User class generated from proto definition\\n */\\nclass User {\\n  constructor(data = {}) {\\n    this.id = data.id ?? 0;\\n    this.email = data.email ?? '';\\n    // ... rest of the generated code\\n  }\\n}"
}`}
            </pre>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#1e1e2e] py-8">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between text-sm text-[#7a7a8c]">
          <span>© {new Date().getFullYear()} proto2any</span>
          <div className="flex items-center gap-4">
            <a
              href="https://protolint.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors"
            >
              Validate with protolint
            </a>
            <a
              href="https://github.com/krappie-code/proto2any"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors"
            >
              GitHub
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}