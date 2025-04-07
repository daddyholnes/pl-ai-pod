import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AI_MODELS, AIModel } from "@/lib/openai";
import { Cpu, ChevronDown } from "lucide-react";
import { FaGoogle } from "react-icons/fa";
import { SiOpenai } from "react-icons/si";

interface ModelSelectorProps {
  selectedModel: AIModel;
  onSelectModel: (model: AIModel) => void;
}

export function ModelSelector({ selectedModel, onSelectModel }: ModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const getModelIcon = (iconName: string) => {
    switch (iconName) {
      case "openai":
        return <SiOpenai className="w-4 h-4 mr-2" />;
      case "google":
        return <FaGoogle className="w-4 h-4 mr-2" />;
      case "anthropic":
        return <Cpu className="w-4 h-4 mr-2" />;
      case "mistral":
        return <Cpu className="w-4 h-4 mr-2" />;
      default:
        return <Cpu className="w-4 h-4 mr-2" />;
    }
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          {getModelIcon(selectedModel.icon)}
          <span>{selectedModel.name}</span>
          <ChevronDown className="w-4 h-4 ml-1" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64">
        <DropdownMenuLabel>OpenAI Models</DropdownMenuLabel>
        {AI_MODELS.OPENAI.map((model) => (
          <DropdownMenuItem
            key={model.id}
            className="flex items-center cursor-pointer"
            onClick={() => {
              onSelectModel(model);
              setIsOpen(false);
            }}
          >
            {getModelIcon(model.icon)}
            {model.name}
          </DropdownMenuItem>
        ))}
        
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Google Models</DropdownMenuLabel>
        {AI_MODELS.GOOGLE.map((model) => (
          <DropdownMenuItem
            key={model.id}
            className="flex items-center cursor-pointer"
            onClick={() => {
              onSelectModel(model);
              setIsOpen(false);
            }}
          >
            {getModelIcon(model.icon)}
            {model.name}
          </DropdownMenuItem>
        ))}
        
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Other Models</DropdownMenuLabel>
        {AI_MODELS.OTHER.map((model) => (
          <DropdownMenuItem
            key={model.id}
            className="flex items-center cursor-pointer"
            onClick={() => {
              onSelectModel(model);
              setIsOpen(false);
            }}
          >
            {getModelIcon(model.icon)}
            {model.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
