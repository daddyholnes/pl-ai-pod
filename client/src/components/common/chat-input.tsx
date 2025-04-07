import { useState, useRef } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { PaperclipIcon, SendIcon, Code } from "lucide-react";

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isWaiting?: boolean;
}

export function ChatInput({ onSendMessage, isWaiting = false }: ChatInputProps) {
  const [message, setMessage] = useState("");
  const [showAttachments, setShowAttachments] = useState(false);
  const [attachments, setAttachments] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleSubmit = () => {
    if (message.trim() && !isWaiting) {
      onSendMessage(message);
      setMessage("");
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };
  
  const handleAttachmentClick = () => {
    setShowAttachments(!showAttachments);
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const newAttachments = Array.from(files).map(file => file.name);
      setAttachments([...attachments, ...newAttachments]);
    }
  };
  
  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };
  
  return (
    <div className="p-4 border-t border-[#333333]">
      <div className="relative">
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your message here..."
          className="min-h-24 pr-24 bg-[#1E1E1E] border-[#333333] resize-none"
        />
        
        <div className="absolute bottom-2 right-2 flex space-x-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleAttachmentClick}
            title="Add attachments"
            type="button"
          >
            <PaperclipIcon className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMessage(msg => msg + "\n```\n\n```")}
            title="Format as code"
            type="button"
          >
            <Code className="h-5 w-5" />
          </Button>
          <Button
            variant="default"
            size="icon"
            onClick={handleSubmit}
            disabled={!message.trim() || isWaiting}
            title="Send message"
            type="button"
          >
            <SendIcon className="h-5 w-5" />
          </Button>
        </div>
      </div>
      
      {showAttachments && attachments.length > 0 && (
        <div className="flex flex-wrap items-center space-x-2 text-xs text-muted-foreground mt-3">
          {attachments.map((attachment, index) => (
            <div key={index} className="bg-[#1E1E1E] p-2 rounded-md flex items-center mb-2">
              <span className="mr-2">{attachment}</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-5 w-5 p-0 text-destructive hover:text-destructive"
                onClick={() => removeAttachment(index)}
              >
                &times;
              </Button>
            </div>
          ))}
          
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={handleAttachmentClick}
          >
            <PaperclipIcon className="h-3.5 w-3.5 mr-1" />
            Add file
          </Button>
        </div>
      )}
      
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        multiple
      />
    </div>
  );
}
