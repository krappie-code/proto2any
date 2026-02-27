"use client";

import { forwardRef, useImperativeHandle, useRef } from "react";
import dynamic from "next/dynamic";
import type { editor } from "monaco-editor";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="h-[500px] bg-[#1e1e1e] rounded-lg animate-pulse" />
  ),
});

export interface MonacoProtoEditorRef {
  getValue: () => string;
  setValue: (value: string) => void;
  focus: () => void;
}

interface MonacoProtoEditorProps {
  value: string;
  onChange?: (value: string) => void;
  onMount?: (editor: editor.IStandaloneCodeEditor) => void;
  height?: string;
}

const MonacoProtoEditor = forwardRef<MonacoProtoEditorRef, MonacoProtoEditorProps>(({
  value,
  onChange,
  onMount,
  height = "500px"
}, ref) => {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

  useImperativeHandle(ref, () => ({
    getValue: () => editorRef.current?.getValue() || '',
    setValue: (value: string) => editorRef.current?.setValue(value),
    focus: () => editorRef.current?.focus(),
  }));

  const handleEditorDidMount = (editor: editor.IStandaloneCodeEditor) => {
    editorRef.current = editor;
    editor.updateOptions({ glyphMargin: true });
    onMount?.(editor);
  };

  return (
    <MonacoEditor
      height={height}
      language="protobuf"
      theme="vs-dark"
      value={value}
      onChange={(v) => onChange?.(v || "")}
      onMount={handleEditorDidMount}
      options={{
        minimap: { enabled: false },
        fontSize: 13,
        lineNumbers: "on",
        scrollBeyondLastLine: false,
        padding: { top: 12 },
        wordWrap: "on",
        glyphMargin: true,
        automaticLayout: true,
      }}
    />
  );
});

MonacoProtoEditor.displayName = "MonacoProtoEditor";

export default MonacoProtoEditor;