import { useState } from "react";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { AIModelParameters } from "@/lib/openai";
import { Card, CardContent } from "@/components/ui/card";

interface ParametersPanelProps {
  parameters: AIModelParameters;
  onUpdateParameters: (parameters: AIModelParameters) => void;
}

export function ParametersPanel({ parameters, onUpdateParameters }: ParametersPanelProps) {
  const [formState, setFormState] = useState<AIModelParameters>({ ...parameters });

  const handleChange = (key: keyof AIModelParameters, value: any) => {
    const newState = { ...formState, [key]: value };
    setFormState(newState);
    onUpdateParameters(newState);
  };

  return (
    <div className="space-y-6 p-4 overflow-y-auto h-full">
      <div>
        <h3 className="text-sm font-medium mb-3">Model Parameters</h3>
        
        <div className="space-y-4">
          {/* Temperature */}
          <Card className="border-[#333333] hover:bg-[#2A2A2A] transition-colors">
            <CardContent className="p-3 space-y-2">
              <div className="flex justify-between items-center">
                <Label className="text-sm font-medium">Temperature</Label>
                <span className="text-xs bg-[#2A2A2A] px-2 py-0.5 rounded">
                  {formState.temperature.toFixed(1)}
                </span>
              </div>
              <Slider
                value={[formState.temperature]}
                min={0}
                max={1}
                step={0.1}
                onValueChange={(value) => handleChange("temperature", value[0])}
                className="cursor-pointer"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Precise</span>
                <span>Creative</span>
              </div>
            </CardContent>
          </Card>
          
          {/* Top P */}
          <Card className="border-[#333333] hover:bg-[#2A2A2A] transition-colors">
            <CardContent className="p-3 space-y-2">
              <div className="flex justify-between items-center">
                <Label className="text-sm font-medium">Top P</Label>
                <span className="text-xs bg-[#2A2A2A] px-2 py-0.5 rounded">
                  {formState.topP.toFixed(1)}
                </span>
              </div>
              <Slider
                value={[formState.topP]}
                min={0}
                max={1}
                step={0.1}
                onValueChange={(value) => handleChange("topP", value[0])}
                className="cursor-pointer"
              />
            </CardContent>
          </Card>
          
          {/* Max Tokens */}
          <Card className="border-[#333333] hover:bg-[#2A2A2A] transition-colors">
            <CardContent className="p-3 space-y-2">
              <div className="flex justify-between items-center">
                <Label className="text-sm font-medium">Max Tokens</Label>
                <span className="text-xs bg-[#2A2A2A] px-2 py-0.5 rounded">
                  {formState.maxTokens}
                </span>
              </div>
              <Slider
                value={[formState.maxTokens]}
                min={256}
                max={4096}
                step={256}
                onValueChange={(value) => handleChange("maxTokens", value[0])}
                className="cursor-pointer"
              />
            </CardContent>
          </Card>
        </div>
      </div>
      
      <div>
        <h3 className="text-sm font-medium mb-3">Response Format</h3>
        
        <RadioGroup
          value={formState.responseFormat}
          onValueChange={(value) => 
            handleChange("responseFormat", value as "json" | "text" | "markdown")
          }
          className="space-y-2"
        >
          <div className="flex items-center space-x-2 p-2 rounded hover:bg-[#2A2A2A] cursor-pointer">
            <RadioGroupItem value="json" id="json" />
            <Label htmlFor="json" className="cursor-pointer">JSON</Label>
          </div>
          
          <div className="flex items-center space-x-2 p-2 rounded hover:bg-[#2A2A2A] cursor-pointer">
            <RadioGroupItem value="text" id="text" />
            <Label htmlFor="text" className="cursor-pointer">Text</Label>
          </div>
          
          <div className="flex items-center space-x-2 p-2 rounded hover:bg-[#2A2A2A] cursor-pointer">
            <RadioGroupItem value="markdown" id="markdown" />
            <Label htmlFor="markdown" className="cursor-pointer">Markdown</Label>
          </div>
        </RadioGroup>
      </div>
      
      <div>
        <h3 className="text-sm font-medium mb-3">System Prompt</h3>
        <Textarea
          value={formState.systemPrompt || ""}
          onChange={(e) => handleChange("systemPrompt", e.target.value)}
          placeholder="Enter system instructions..."
          className="min-h-24 bg-[#1E1E1E] border-[#333333] resize-none"
        />
      </div>
    </div>
  );
}
