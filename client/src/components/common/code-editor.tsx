import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clipboard, Play, FileCode2 } from "lucide-react";

interface CodeEditorProps {
  code: string;
  onCodeChange: (code: string) => void;
  onRunCode?: () => void;
  language?: string;
  onLanguageChange?: (language: string) => void;
}

const LANGUAGES = [
  { value: "javascript", label: "JavaScript" },
  { value: "typescript", label: "TypeScript" },
  { value: "python", label: "Python" },
  { value: "html", label: "HTML" },
  { value: "css", label: "CSS" },
];

export function CodeEditor({
  code,
  onCodeChange,
  onRunCode,
  language = "javascript",
  onLanguageChange,
}: CodeEditorProps) {
  const [copied, setCopied] = useState(false);
  const [editorValue, setEditorValue] = useState(code);
  
  useEffect(() => {
    setEditorValue(code);
  }, [code]);
  
  const handleCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditorValue(e.target.value);
    onCodeChange(e.target.value);
  };
  
  const copyToClipboard = async () => {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(editorValue);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };
  
  const handleLanguageChange = (value: string) => {
    if (onLanguageChange) {
      onLanguageChange(value);
    }
  };
  
  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-hidden relative">
        <textarea
          value={editorValue}
          onChange={handleCodeChange}
          className="h-full w-full p-4 font-mono text-sm bg-[#1E1E1E] outline-none resize-none"
          spellCheck="false"
        />
      </div>
      
      <div className="p-3 border-t border-[#333333] flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <Select value={language} onValueChange={handleLanguageChange}>
            <SelectTrigger className="w-32 bg-[#1E1E1E] border-[#333333]">
              <SelectValue placeholder="Language" />
            </SelectTrigger>
            <SelectContent>
              {LANGUAGES.map((lang) => (
                <SelectItem key={lang.value} value={lang.value}>
                  {lang.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={copyToClipboard}
              title="Copy code"
            >
              <Clipboard className="h-4 w-4 mr-1" />
              {copied ? "Copied" : "Copy"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              title="Format code"
              onClick={() => {
                // Simple formatting for demo purposes
                try {
                  const formatted = JSON.stringify(JSON.parse(editorValue), null, 2);
                  setEditorValue(formatted);
                  onCodeChange(formatted);
                } catch (e) {
                  // Not JSON, skip formatting
                }
              }}
            >
              <FileCode2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {onRunCode && (
          <Button
            variant="default"
            size="sm"
            onClick={onRunCode}
            className="bg-primary hover:bg-primary/90"
          >
            <Play className="h-4 w-4 mr-1" />
            Run
          </Button>
        )}
      </div>
    </div>
  );
}
