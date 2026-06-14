import CodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { json } from "@codemirror/lang-json";

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language?: "javascript" | "json";
  minHeight?: string;
}

export function CodeEditor({ value, onChange, language = "javascript", minHeight = "220px" }: CodeEditorProps) {
  const extensions = language === "json" ? [json()] : [javascript()];

  return (
    <div className="overflow-hidden rounded-md border border-border-subtle">
      <CodeMirror
        value={value}
        height={minHeight}
        extensions={extensions}
        onChange={(next) => {
          if (next !== value) onChange(next);
        }}
        basicSetup={{
          lineNumbers: true,
          foldGutter: true,
          highlightActiveLine: true,
        }}
        className="text-sm [&_.cm-editor]:bg-surface-editor [&_.cm-gutters]:border-r [&_.cm-gutters]:border-border-subtle [&_.cm-gutters]:bg-surface-elevated"
      />
    </div>
  );
}
