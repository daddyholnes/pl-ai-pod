import * as React from 'react';
import { useState, useRef, useEffect } from 'react';

// Mock interface for chat messages
interface ChatMessage {
  role: 'user' | 'model' | 'system';
  content: string;
  timestamp: string;
  isSummary?: boolean;
}

interface ModelOption {
  id: string;
  name: string;
}

const availableModels: ModelOption[] = [
  { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro' },
  { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash' },
  { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro' },
  { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash' },
];

// Model Selector Component
const ModelSelector: React.FC<{models: ModelOption[], onModelChange: (modelId: string) => void}> = 
  ({models, onModelChange}) => {
  return (
    <select 
      className="model-selector"
      onChange={(e) => onModelChange(e.target.value)}
    >
      {models.map(model => (
        <option key={model.id} value={model.id}>
          {model.name}
        </option>
      ))}
    </select>
  );
};

// Single Message Component
const ChatMessageItem: React.FC<{message: ChatMessage}> = ({message}) => {
  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  return (
    <div className={`message ${message.role} ${message.isSummary ? 'summary' : ''}`}>
      <div className="message-header">
        <span className="message-role">
          {message.role === 'model' ? 'AI' : message.role === 'user' ? 'You' : 'System'}
        </span>
        <span className="message-time">{formatDate(message.timestamp)}</span>
      </div>
      <div className="message-content">{message.content}</div>
    </div>
  );
};

// Chat Panel Component
export const ChatPanel: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [selectedModel, setSelectedModel] = useState(availableModels[0].id);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Scrolling to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Function to handle message sending
  const handleSendMessage = () => {
    if (!inputValue.trim()) return;
    
    // Add user message
    const userMessage: ChatMessage = {
      role: 'user',
      content: inputValue,
      timestamp: new Date().toISOString()
    };
    
    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    
    // In a real implementation, send to VS Code extension host
    // using the acquireVsCodeApi().postMessage method
    window.parent.postMessage({ 
      command: 'sendMessage', 
      text: inputValue,
      modelId: selectedModel
    }, '*');
    
    // Mock AI response for demonstration
    setTimeout(() => {
      const aiMessage: ChatMessage = {
        role: 'model',
        content: `This is a simulated response to: "${inputValue}"`,
        timestamp: new Date().toISOString()
      };
      setMessages((prev) => [...prev, aiMessage]);
    }, 1000);
  };

  // Function to handle model change
  const handleModelChange = (modelId: string) => {
    setSelectedModel(modelId);
    // Notify VS Code of model change
    window.parent.postMessage({ 
      command: 'changeModel', 
      modelId: modelId
    }, '*');
  };

  return (
    <div className="chat-panel">
      <div className="panel-header">
        <ModelSelector models={availableModels} onModelChange={handleModelChange} />
        <button className="clear-chat">Clear Chat</button>
      </div>
      
      <div className="chat-messages">
        {messages.map((msg, index) => (
          <ChatMessageItem key={index} message={msg} />
        ))}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="chat-input-container">
        <textarea 
          className="chat-input"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSendMessage();
            }
          }}
          placeholder="Type your message here..."
          rows={3}
        />
        <button 
          className="send-button"
          onClick={handleSendMessage}
          disabled={!inputValue.trim()}
        >
          Send
        </button>
      </div>
    </div>
  );
};
