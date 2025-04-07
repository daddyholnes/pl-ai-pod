import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, Clipboard, Code } from "lucide-react";

interface CodeBlockProps {
  code: string;
  language?: string;
  showLineNumbers?: boolean;
  className?: string;
}

export function CodeBlock({
  code,
  language = "javascript",
  showLineNumbers = true,
  className = "",
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const codeRef = useRef<HTMLPreElement>(null);

  const copyToClipboard = async () => {
    if (navigator.clipboard && codeRef.current) {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Split code by newlines for line numbers
  const codeLines = code.split("\n");
  
  return (
    <div className={`relative rounded-md bg-[#1E1E1E] font-mono text-sm overflow-hidden ${className}`}>
      <div className="flex items-center justify-between p-2 border-b border-[#333333] bg-[#2A2A2A]">
        <div className="flex items-center">
          <Code size={16} className="mr-2" />
          <span className="text-xs font-medium">{language}</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-2 text-xs"
          onClick={copyToClipboard}
        >
          {copied ? <Check size={16} /> : <Clipboard size={16} />}
          <span className="ml-1">{copied ? "Copied!" : "Copy"}</span>
        </Button>
      </div>
      
      <div className="relative overflow-auto">
        <pre 
          ref={codeRef} 
          className="p-4 overflow-auto max-h-[400px]"
        >
          {showLineNumbers ? (
            <div className="flex">
              <div className="text-right pr-4 select-none text-[#666666] border-r border-[#333333] mr-4">
                {codeLines.map((_, idx) => (
                  <div key={idx}>{idx + 1}</div>
                ))}
              </div>
              <code>
                {codeLines.map((line, idx) => (
                  <div key={idx}>{line || " "}</div>
                ))}
              </code>
            </div>
          ) : (
            <code>{code}</code>
          )}
        </pre>
      </div>
    </div>
  );
}
