import { createContext, useContext, useState, useEffect } from "react";
import { ChatMessage } from "@/lib/openai";
import { nanoid } from "nanoid";

export type Chat = {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
};

export type Project = {
  id: string;
  name: string;
  code: string;
  language: string;
  createdAt: number;
  updatedAt: number;
};

interface WorkspaceContextType {
  chats: Chat[];
  projects: Project[];
  selectedChat: string | null;
  selectedProject: string | null;
  setSelectedChat: (id: string | null) => void;
  setSelectedProject: (id: string | null) => void;
  createNewChat: (id: string, title: string) => void;
  addMessageToChat: (chatId: string, message: ChatMessage) => void;
  clearChat: (chatId: string) => void;
  updateChatTitle: (chatId: string, title: string) => void;
  createNewProject: (name: string, code: string, language: string) => void;
  updateProject: (id: string, code: string, language: string) => void;
}

const WorkspaceContext = createContext<WorkspaceContextType>({
  chats: [],
  projects: [],
  selectedChat: null,
  selectedProject: null,
  setSelectedChat: () => {},
  setSelectedProject: () => {},
  createNewChat: () => {},
  addMessageToChat: () => {},
  clearChat: () => {},
  updateChatTitle: () => {},
  createNewProject: () => {},
  updateProject: () => {},
});

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  
  // Load saved state from localStorage
  useEffect(() => {
    const savedChats = localStorage.getItem("ai_studio_chats");
    const savedProjects = localStorage.getItem("ai_studio_projects");
    const savedSelectedChat = localStorage.getItem("ai_studio_selected_chat");
    const savedSelectedProject = localStorage.getItem("ai_studio_selected_project");
    
    if (savedChats) {
      try {
        setChats(JSON.parse(savedChats));
      } catch (error) {
        console.error("Failed to parse saved chats:", error);
      }
    }
    
    if (savedProjects) {
      try {
        setProjects(JSON.parse(savedProjects));
      } catch (error) {
        console.error("Failed to parse saved projects:", error);
      }
    }
    
    if (savedSelectedChat) {
      setSelectedChat(savedSelectedChat);
    }
    
    if (savedSelectedProject) {
      setSelectedProject(savedSelectedProject);
    }
    
    // Create a default chat if none exists
    if (!savedChats || JSON.parse(savedChats).length === 0) {
      const newChatId = nanoid();
      const defaultChat: Chat = {
        id: newChatId,
        title: "New Conversation",
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      setChats([defaultChat]);
      setSelectedChat(newChatId);
    }
  }, []);
  
  // Save state to localStorage when it changes
  useEffect(() => {
    localStorage.setItem("ai_studio_chats", JSON.stringify(chats));
  }, [chats]);
  
  useEffect(() => {
    localStorage.setItem("ai_studio_projects", JSON.stringify(projects));
  }, [projects]);
  
  useEffect(() => {
    if (selectedChat) {
      localStorage.setItem("ai_studio_selected_chat", selectedChat);
    }
  }, [selectedChat]);
  
  useEffect(() => {
    if (selectedProject) {
      localStorage.setItem("ai_studio_selected_project", selectedProject);
    }
  }, [selectedProject]);
  
  const createNewChat = (id: string, title: string) => {
    const newChat: Chat = {
      id,
      title,
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setChats(prev => [newChat, ...prev]);
    return newChat;
  };
  
  const addMessageToChat = (chatId: string, message: ChatMessage) => {
    setChats(prev => {
      const chatIndex = prev.findIndex(chat => chat.id === chatId);
      if (chatIndex === -1) return prev;
      
      const updatedChats = [...prev];
      const chat = { ...updatedChats[chatIndex] };
      
      // If this is the first user message, update the chat title
      if (message.role === "user" && !chat.messages.some(m => m.role === "user")) {
        // Use the first ~30 chars of the message as the title
        const title = message.content.substring(0, 30) + (message.content.length > 30 ? "..." : "");
        chat.title = title;
      }
      
      chat.messages = [...chat.messages, message];
      chat.updatedAt = Date.now();
      updatedChats[chatIndex] = chat;
      return updatedChats;
    });
  };
  
  const clearChat = (chatId: string) => {
    setChats(prev => {
      const chatIndex = prev.findIndex(chat => chat.id === chatId);
      if (chatIndex === -1) return prev;
      
      const updatedChats = [...prev];
      updatedChats[chatIndex] = {
        ...updatedChats[chatIndex],
        messages: [],
        updatedAt: Date.now(),
      };
      return updatedChats;
    });
  };
  
  const updateChatTitle = (chatId: string, title: string) => {
    setChats(prev => {
      const chatIndex = prev.findIndex(chat => chat.id === chatId);
      if (chatIndex === -1) return prev;
      
      const updatedChats = [...prev];
      updatedChats[chatIndex] = {
        ...updatedChats[chatIndex],
        title,
        updatedAt: Date.now(),
      };
      return updatedChats;
    });
  };
  
  const createNewProject = (name: string, code: string, language: string) => {
    const newProject: Project = {
      id: nanoid(),
      name,
      code,
      language,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setProjects(prev => [newProject, ...prev]);
    setSelectedProject(newProject.id);
    return newProject;
  };
  
  const updateProject = (id: string, code: string, language: string) => {
    setProjects(prev => {
      const projectIndex = prev.findIndex(project => project.id === id);
      if (projectIndex === -1) return prev;
      
      const updatedProjects = [...prev];
      updatedProjects[projectIndex] = {
        ...updatedProjects[projectIndex],
        code,
        language,
        updatedAt: Date.now(),
      };
      return updatedProjects;
    });
  };
  
  return (
    <WorkspaceContext.Provider
      value={{
        chats,
        projects,
        selectedChat,
        selectedProject,
        setSelectedChat,
        setSelectedProject,
        createNewChat,
        addMessageToChat,
        clearChat,
        updateChatTitle,
        createNewProject,
        updateProject,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export const useWorkspace = () => useContext(WorkspaceContext);
