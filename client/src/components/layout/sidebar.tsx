import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";
import { useWorkspace } from "@/context/workspace-context";
import { 
  FileIcon, 
  MessageSquarePlus, 
  FolderIcon, 
  MoonIcon, 
  HelpCircleIcon
} from "lucide-react";
import { nanoid } from "nanoid";

export function Sidebar() {
  const { user } = useAuth();
  const { 
    chats, 
    projects, 
    selectedChat, 
    selectedProject,
    setSelectedChat,
    setSelectedProject,
    createNewChat
  } = useWorkspace();
  
  const handleNewChat = () => {
    const newChatId = nanoid();
    createNewChat(newChatId, "New Conversation");
    setSelectedChat(newChatId);
  };
  
  const isMobile = window.innerWidth < 768;
  
  return (
    <div className="w-16 md:w-56 bg-[#1E1E1E] border-r border-[#333333] flex flex-col h-full">
      <div className="p-2 md:p-4">
        <Button
          variant="default"
          className="flex justify-center md:justify-start items-center w-full"
          onClick={handleNewChat}
        >
          <MessageSquarePlus className="h-4 w-4 md:mr-2" />
          <span className="hidden md:inline">New Chat</span>
        </Button>
      </div>
      
      <div className="flex-1 overflow-y-auto px-2 pb-4">
        <div className="mb-4">
          <h2 className="text-xs uppercase text-muted-foreground px-2 py-1 hidden md:block">
            Recent Chats
          </h2>
          
          {chats.map((chat) => (
            <Button
              key={chat.id}
              variant="ghost"
              className={`flex justify-center md:justify-start items-center w-full px-2 py-2 mb-1 ${
                selectedChat === chat.id ? "bg-accent" : ""
              }`}
              onClick={() => setSelectedChat(chat.id)}
            >
              <FileIcon className="h-4 w-4 md:mr-2" />
              <span className="truncate hidden md:inline">{chat.title}</span>
            </Button>
          ))}
          
          {chats.length === 0 && (
            <p className="text-xs text-muted-foreground px-4 py-2 hidden md:block">
              No recent chats
            </p>
          )}
        </div>
        
        <div>
          <h2 className="text-xs uppercase text-muted-foreground px-2 py-1 hidden md:block">
            Saved Projects
          </h2>
          
          {projects.map((project) => (
            <Button
              key={project.id}
              variant="ghost"
              className={`flex justify-center md:justify-start items-center w-full px-2 py-2 mb-1 ${
                selectedProject === project.id ? "bg-accent" : ""
              }`}
              onClick={() => setSelectedProject(project.id)}
            >
              <FolderIcon className="h-4 w-4 md:mr-2" />
              <span className="truncate hidden md:inline">{project.name}</span>
            </Button>
          ))}
          
          {projects.length === 0 && (
            <p className="text-xs text-muted-foreground px-4 py-2 hidden md:block">
              No saved projects
            </p>
          )}
        </div>
      </div>
      
      <div className="p-2 border-t border-[#333333]">
        <Button
          variant="ghost"
          className="flex justify-center md:justify-start items-center w-full px-2 py-2 mb-1"
          onClick={() => document.documentElement.classList.toggle('dark')}
        >
          <MoonIcon className="h-4 w-4 md:mr-2" />
          <span className="hidden md:inline">Dark Mode</span>
        </Button>
        
        <Button
          variant="ghost"
          className="flex justify-center md:justify-start items-center w-full px-2 py-2"
          onClick={() => window.open('https://github.com/genkit-ai/genkit', '_blank')}
        >
          <HelpCircleIcon className="h-4 w-4 md:mr-2" />
          <span className="hidden md:inline">Help & Docs</span>
        </Button>
      </div>
    </div>
  );
}
