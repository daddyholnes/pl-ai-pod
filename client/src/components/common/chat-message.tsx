import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChatMessage as ChatMessageType } from "@/lib/openai";
import { CodeBlock } from "@/components/ui/code-block";
import { useState } from "react";

interface ChatMessageProps {
  message: ChatMessageType;
  userName: string;
}

export function ChatMessage({ message, userName }: ChatMessageProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  
  const formattedTime = new Date(message.timestamp).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  
  const isUser = message.role === "user";
  const isSystem = message.role === "system";
  const senderName = isUser ? userName : "AI Assistant";
  
  // Check for code blocks in the message
  const parseMessageContent = (content: string) => {
    // Simple regex to detect markdown code blocks
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    let lastIndex = 0;
    const parts = [];
    let match;

    while ((match = codeBlockRegex.exec(content)) !== null) {
      // Add text before the code block
      if (match.index > lastIndex) {
        parts.push({
          type: "text",
          content: content.substring(lastIndex, match.index)
        });
      }
      
      // Add the code block
      parts.push({
        type: "code",
        language: match[1] || "javascript",
        content: match[2]
      });
      
      lastIndex = match.index + match[0].length;
    }
    
    // Add remaining text after the last code block
    if (lastIndex < content.length) {
      parts.push({
        type: "text",
        content: content.substring(lastIndex)
      });
    }
    
    return parts.length > 0 ? parts : [{ type: "text", content }];
  };
  
  const contentParts = parseMessageContent(message.content);
  
  if (isSystem) {
    return (
      <div className="chat-message bg-[#2A2A2A] bg-opacity-50 rounded-lg p-4 mx-4">
        <p className="text-muted-foreground">{message.content}</p>
      </div>
    );
  }
  
  return (
    <div className={`chat-message flex space-x-3 ${isExpanded ? "" : "opacity-75"}`}>
      <div className="flex-shrink-0">
        <Avatar className="h-8 w-8">
          {isUser ? (
            <AvatarImage src="https://github.com/shadcn.png" alt={userName} />
          ) : (
            <AvatarImage src="https://api.dicebear.com/6.x/bottts/svg?seed=aibot" alt="AI Assistant" />
          )}
          <AvatarFallback>{isUser ? userName[0] : "AI"}</AvatarFallback>
        </Avatar>
      </div>
      
      <div className="flex-1">
        <div className="flex items-center mb-1">
          <span className="font-medium mr-2">{senderName}</span>
          <span className="text-xs text-muted-foreground">{formattedTime}</span>
        </div>
        
        <div
          className="prose prose-sm prose-invert max-w-none"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {contentParts.map((part, index) => {
            if (part.type === "code") {
              return (
                <CodeBlock
                  key={index}
                  code={part.content}
                  language={part.language}
                  className="my-3"
                />
              );
            } else {
              return (
                <div key={index} className="whitespace-pre-wrap">
                  {part.content}
                </div>
              );
            }
          })}
        </div>
      </div>
    </div>
  );
}
