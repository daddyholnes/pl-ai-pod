import { useState, useEffect, useRef } from "react";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { ChatMessage } from "@/components/common/chat-message";
import { ChatInput } from "@/components/common/chat-input";
import { CodeEditor } from "@/components/common/code-editor";
import { ParametersPanel } from "@/components/common/parameters-panel";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { Eraser, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { 
  AIModel, 
  AIModelParameters, 
  ChatMessage as ChatMessageType,
  DEFAULT_MODEL,
  DEFAULT_PARAMETERS,
  sendChatMessage
} from "@/lib/openai";
import { useAuth } from "@/context/auth-context";
import { useWorkspace } from "@/context/workspace-context";
import { nanoid } from "nanoid";
import { useQueryClient } from "@tanstack/react-query";

export default function Home() {
  const { user } = useAuth();
  const { selectedChat, chats, addMessageToChat, clearChat } = useWorkspace();
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [model, setModel] = useState<AIModel>(DEFAULT_MODEL);
  const [parameters, setParameters] = useState<AIModelParameters>(DEFAULT_PARAMETERS);
  const [activeTab, setActiveTab] = useState("code-editor");
  const [code, setCode] = useState<string>("");
  const [codeLanguage, setCodeLanguage] = useState("javascript");
  const [isWaitingForResponse, setIsWaitingForResponse] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Initialize with a system message
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{
        id: nanoid(),
        role: "system",
        content: "I'm your AI assistant. I can help you with coding, answering questions, and more. How can I assist you today?",
        timestamp: Date.now()
      }]);
    }
  }, [messages.length]);
  
  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  
  // Set messages from selected chat
  useEffect(() => {
    if (selectedChat) {
      const chat = chats.find(c => c.id === selectedChat);
      if (chat) {
        setMessages(chat.messages);
      }
    }
  }, [selectedChat, chats]);
  
  const handleSendMessage = async (content: string) => {
    if (!content.trim() || isWaitingForResponse) return;
    
    const userMessage: ChatMessageType = {
      id: nanoid(),
      role: "user",
      content,
      timestamp: Date.now()
    };
    
    // Update local state
    setMessages(prev => [...prev, userMessage]);
    
    // Update workspace context
    if (selectedChat) {
      addMessageToChat(selectedChat, userMessage);
    }
    
    // Set waiting state
    setIsWaitingForResponse(true);
    
    try {
      // Add loading message temporarily
      const loadingMsgId = nanoid();
      setMessages(prev => [
        ...prev, 
        { 
          id: loadingMsgId, 
          role: "assistant", 
          content: "Thinking...", 
          timestamp: Date.now() 
        }
      ]);
      
      // Send to API
      const aiResponse = await sendChatMessage(
        model,
        [...messages.filter(m => m.role !== "system"), userMessage],
        parameters
      );
      
      // Remove loading message
      setMessages(prev => prev.filter(m => m.id !== loadingMsgId));
      
      // Add real response
      const assistantMessage: ChatMessageType = {
        id: nanoid(),
        role: "assistant",
        content: aiResponse.message || "I'm not sure how to respond to that.",
        timestamp: Date.now()
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      
      // Update workspace context
      if (selectedChat) {
        addMessageToChat(selectedChat, assistantMessage);
      }
      
      // If response contains code, update the code editor
      const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/;
      const codeMatch = assistantMessage.content.match(codeBlockRegex);
      if (codeMatch) {
        setCode(codeMatch[2]);
        if (codeMatch[1]) {
          setCodeLanguage(codeMatch[1]);
        }
      }
      
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: "Failed to get AI response. Please try again.",
        variant: "destructive"
      });
      
      // Remove loading message on error
      setMessages(prev => prev.filter(m => m.id !== 'loading'));
    } finally {
      setIsWaitingForResponse(false);
    }
  };
  
  const handleClearChat = () => {
    if (selectedChat) {
      clearChat(selectedChat);
      setMessages([{
        id: nanoid(),
        role: "system",
        content: "I'm your AI assistant. I can help you with coding, answering questions, and more. How can I assist you today?",
        timestamp: Date.now()
      }]);
    }
  };
  
  const handleExportChat = () => {
    // Export chat as JSON
    const chatData = {
      id: selectedChat,
      messages: messages.filter(m => m.role !== "system"),
      model: model,
      timestamp: Date.now()
    };
    
    const blob = new Blob([JSON.stringify(chatData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `chat-export-${new Date().toISOString()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  const handleRunCode = () => {
    toast({
      title: "Code Execution",
      description: "Code execution is not available in the prototype version",
    });
  };
  
  return (
    <div className="flex flex-col h-screen bg-background">
      <Header selectedModel={model} onSelectModel={setModel} />
      
      <div className="flex-1 flex overflow-hidden">
        <Sidebar />
        
        <div className="flex-1 flex flex-col overflow-hidden">
          <ResizablePanelGroup direction="horizontal">
            <ResizablePanel defaultSize={50} minSize={30}>
              <div className="flex flex-col h-full">
                <div className="border-b border-[#333333] p-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold">AI Chat</h2>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleClearChat}
                        title="Clear chat"
                      >
                        <Eraser className="h-5 w-5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleExportChat}
                        title="Export conversation"
                      >
                        <Download className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.map((message) => (
                    <ChatMessage 
                      key={message.id} 
                      message={message} 
                      userName={user?.name || "User"}
                    />
                  ))}
                  <div ref={messagesEndRef} />
                </div>
                
                <ChatInput 
                  onSendMessage={handleSendMessage} 
                  isWaiting={isWaitingForResponse}
                />
              </div>
            </ResizablePanel>
            
            <ResizableHandle withHandle />
            
            <ResizablePanel defaultSize={50} minSize={30}>
              <Tabs 
                value={activeTab} 
                onValueChange={setActiveTab}
                className="h-full flex flex-col"
              >
                <TabsList className="mx-4 mt-4 mb-0">
                  <TabsTrigger value="code-editor">Code Editor</TabsTrigger>
                  <TabsTrigger value="preview">Preview</TabsTrigger>
                  <TabsTrigger value="parameters">Parameters</TabsTrigger>
                </TabsList>
                
                <TabsContent value="code-editor" className="flex-1 p-0 m-0">
                  <CodeEditor
                    code={code}
                    onCodeChange={setCode}
                    onRunCode={handleRunCode}
                    language={codeLanguage}
                    onLanguageChange={setCodeLanguage}
                  />
                </TabsContent>
                
                <TabsContent value="preview" className="flex-1 p-4 m-0 overflow-auto">
                  <div className="bg-[#1E1E1E] rounded-lg border border-[#333333] p-4 mb-4">
                    <h3 className="text-sm font-medium mb-2">Preview Output</h3>
                    <p className="text-muted-foreground text-sm">Run the code to see the results</p>
                  </div>
                  
                  <div className="bg-[#1E1E1E] rounded-lg border border-[#333333]">
                    <div className="border-b border-[#333333] p-3 flex justify-between items-center">
                      <span className="text-sm font-medium">Console Output</span>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Eraser className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="p-3 font-mono text-xs overflow-x-auto">
                      <p className="text-green-500">Ready to execute code...</p>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="parameters" className="flex-1 p-0 m-0">
                  <ParametersPanel
                    parameters={parameters}
                    onUpdateParameters={setParameters}
                  />
                </TabsContent>
              </Tabs>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      </div>
    </div>
  );
}
