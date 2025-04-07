import { Button } from "@/components/ui/button";
import { ModelSelector } from "@/components/common/model-selector";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { AIModel } from "@/lib/openai";
import { useAuth } from "@/context/auth-context";
import { Settings, LogOut, User } from "lucide-react";

interface HeaderProps {
  selectedModel: AIModel;
  onSelectModel: (model: AIModel) => void;
}

export function Header({ selectedModel, onSelectModel }: HeaderProps) {
  const { user, logout } = useAuth();
  
  return (
    <header className="bg-[#1E1E1E] border-b border-[#333333] px-4 h-14 flex items-center justify-between">
      <div className="flex items-center space-x-2">
        <div className="h-8 w-8 rounded bg-primary grid place-items-center">
          <span className="text-white font-bold">G</span>
        </div>
        <h1 className="text-lg font-semibold">GenKit AI Studio</h1>
      </div>
      
      <div className="flex items-center space-x-4">
        <ModelSelector
          selectedModel={selectedModel}
          onSelectModel={onSelectModel}
        />
        
        <Separator orientation="vertical" className="h-6" />
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarImage src="https://github.com/shadcn.png" alt={user?.name} />
                <AvatarFallback>{user?.name ? user.name[0] : "U"}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <div className="flex items-center justify-start gap-2 p-2">
              <div className="flex flex-col space-y-1 leading-none">
                <p className="font-medium">{user?.name}</p>
                <p className="w-[200px] truncate text-sm text-muted-foreground">
                  {user?.email}
                </p>
              </div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer">
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer">
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="cursor-pointer text-destructive focus:text-destructive"
              onClick={logout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
