import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import * as monaco from 'monaco-editor';
import { ChatPanel } from './ChatPanel';
import { ScreenShare } from './ScreenShare';

// Model options
const models = [
  { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro' },
  { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash' },
  { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro' },
  { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash' },
];

// Tab data
interface Tab {
  id: string;
  label: string;
  language: string;
  content: string;
}

interface ConsoleMessage {
  type: 'log' | 'error' | 'warning' | 'info';
  content: string;
  timestamp: string;
}

export const MainLayout: React.FC = () => {
  // State
  const [activeTab, setActiveTab] = useState<string>('editor');
  const [selectedModel, setSelectedModel] = useState<string>(models[0].id);
  const [leftPanelWidth, setLeftPanelWidth] = useState<number>(400);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [tabs, setTabs] = useState<Tab[]>([
    { id: 'main', label: 'main.js', language: 'javascript', content: '// Your code here\nconsole.log("Hello World!");' }
  ]);
  const [activeTabId, setActiveTabId] = useState<string>('main');
  const [consoleMessages, setConsoleMessages] = useState<ConsoleMessage[]>([
    { type: 'info', content: 'Console initialized', timestamp: new Date().toISOString() }
  ]);
  
  // Refs
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const userId = useRef<string>('user-123'); // Replace with actual user ID logic
  
  // Initialize Monaco Editor
  useEffect(() => {
    if (editorContainerRef.current && !editorRef.current) {
      // Define Monaco editor
      editorRef.current = monaco.editor.create(editorContainerRef.current, {
        value: tabs.find(tab => tab.id === activeTabId)?.content || '',
        language: tabs.find(tab => tab.id === activeTabId)?.language || 'javascript',
        theme: 'vs-dark',
        automaticLayout: true,
        minimap: { enabled: true },
        scrollBeyondLastLine: false,
        fontSize: 14,
        wordWrap: 'on'
      });

      // Update tab content when editor content changes
      editorRef.current.onDidChangeModelContent(() => {
        if (!editorRef.current) return;
        
        const newContent = editorRef.current.getValue();
        setTabs(prevTabs =>
          prevTabs.map(tab =>
            tab.id === activeTabId ? { ...tab, content: newContent } : tab
          )
        );
      });
    }
    
    // Update editor content when tab changes
    if (editorRef.current) {
      const currentTab = tabs.find(tab => tab.id === activeTabId);
      if (currentTab) {
        const model = monaco.editor.createModel(
          currentTab.content,
          currentTab.language
        );
        editorRef.current.setModel(model);
      }
    }
    
    return () => {
      if (editorRef.current) {
        editorRef.current.dispose();
        editorRef.current = null;
      }
    };
  }, [activeTabId, tabs]);
  
  // Handle panel resize
  const handleMouseDown = () => {
    setIsDragging(true);
  };
  
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const minWidth = 250;
      const maxWidth = window.innerWidth - 400;
      const newWidth = Math.max(minWidth, Math.min(maxWidth, e.clientX));
      setLeftPanelWidth(newWidth);
    };
    
    const handleMouseUp = () => {
      setIsDragging(false);
    };
    
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  // Create a new tab
  const createNewTab = () => {
    const id = `tab-${Date.now()}`;
    const newTab = {
      id,
      label: `untitled-${tabs.length + 1}.js`,
      language: 'javascript',
      content: '// New file\n'
    };
    setTabs([...tabs, newTab]);
    setActiveTabId(id);
  };
  
  // Close tab
  const closeTab = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (tabs.length === 1) {
      // Don't close the last tab, just clear it
      setTabs([{ id: 'main', label: 'main.js', language: 'javascript', content: '// Your code here' }]);
      setActiveTabId('main');
      return;
    }
    
    const newTabs = tabs.filter(tab => tab.id !== id);
    setTabs(newTabs);
    
    // If we closed the active tab, activate another one
    if (activeTabId === id) {
      setActiveTabId(newTabs[0].id);
    }
  };
  
  // Execute code
  const executeCode = () => {
    const currentTab = tabs.find(tab => tab.id === activeTabId);
    if (!currentTab) return;
    
    const code = currentTab.content;
    
    // Clear previous run
    setConsoleMessages(prev => [
      ...prev,
      { type: 'info', content: '--- Execution started ---', timestamp: new Date().toISOString() }
    ]);
    
    try {
      // Capture console output
      const originalConsoleLog = console.log;
      const originalConsoleError = console.error;
      const originalConsoleWarn = console.warn;
      const originalConsoleInfo = console.info;
      
      console.log = (...args: any[]) => {
        setConsoleMessages(prev => [
          ...prev,
          { type: 'log', content: args.map(arg => String(arg)).join(' '), timestamp: new Date().toISOString() }
        ]);
        originalConsoleLog(...args);
      };
      
      console.error = (...args: any[]) => {
        setConsoleMessages(prev => [
          ...prev,
          { type: 'error', content: args.map(arg => String(arg)).join(' '), timestamp: new Date().toISOString() }
        ]);
        originalConsoleError(...args);
      };
      
      console.warn = (...args: any[]) => {
        setConsoleMessages(prev => [
          ...prev,
          { type: 'warning', content: args.map(arg => String(arg)).join(' '), timestamp: new Date().toISOString() }
        ]);
        originalConsoleWarn(...args);
      };
      
      console.info = (...args: any[]) => {
        setConsoleMessages(prev => [
          ...prev,
          { type: 'info', content: args.map(arg => String(arg)).join(' '), timestamp: new Date().toISOString() }
        ]);
        originalConsoleInfo(...args);
      };
      
      // Execute in a safer way using Function constructor
      // Note: This is still not completely safe for production
      const executeFunction = new Function('console', `
        try {
          ${code}
          return { success: true };
        } catch (error) {
          return { success: false, error: error.message };
        }
      `);
      
      const result = executeFunction(console);
      
      if (!result.success) {
        setConsoleMessages(prev => [
          ...prev,
          { type: 'error', content: result.error, timestamp: new Date().toISOString() }
        ]);
      }
      
      // Restore console functions
      console.log = originalConsoleLog;
      console.error = originalConsoleError;
      console.warn = originalConsoleWarn;
      console.info = originalConsoleInfo;
      
    } catch (error: any) {
      setConsoleMessages(prev => [
        ...prev,
        { type: 'error', content: error.message || 'Execution error', timestamp: new Date().toISOString() }
      ]);
    }
    
    setConsoleMessages(prev => [
      ...prev,
      { type: 'info', content: '--- Execution finished ---', timestamp: new Date().toISOString() }
    ]);
  };
  
  // Handle screen capture
  const handleScreenCapture = (imageUrl: string) => {
    // This could send the image URL to the chat for context
    // For example, through a special message or command
    console.log('Screen captured:', imageUrl);
  };

  return (
    <div className="main-layout">
      <div className="top-bar">
        <div className="logo">PodPlay Pen</div>
        
        <select 
          className="model-selector"
          value={selectedModel}
          onChange={(e) => setSelectedModel(e.target.value)}
        >
          {models.map(model => (
            <option key={model.id} value={model.id}>
              {model.name}
            </option>
          ))}
        </select>
        
        <div className="top-actions">
          <ScreenShare 
            onImageCaptured={handleScreenCapture} 
            userId={userId.current}
          />
          <button className="theme-toggle">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="5"></circle>
              <line x1="12" y1="1" x2="12" y2="3"></line>
              <line x1="12" y1="21" x2="12" y2="23"></line>
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
              <line x1="1" y1="12" x2="3" y2="12"></line>
              <line x1="21" y1="12" x2="23" y2="12"></line>
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
            </svg>
          </button>
        </div>
      </div>
      
      <div className="main-content">
        {/* Left Panel - Chat */}
        <div 
          className="panel chat-panel"
          style={{ width: `${leftPanelWidth}px` }}
        >
          <ChatPanel selectedModel={selectedModel} />
        </div>
        
        {/* Resizer */}
        <div 
          className="resize-handle"
          onMouseDown={handleMouseDown}
        ></div>
        
        {/* Right Panel - Editor & Console */}
        <div className="panel editor-console-panel">
          {/* Tabs for Editor, Preview, Parameters */}
          <div className="tabs-container">
            <div className="tab-headers">
              <button 
                className={`tab-button ${activeTab === 'editor' ? 'active' : ''}`}
                onClick={() => setActiveTab('editor')}
              >
                Code Editor
              </button>
              <button 
                className={`tab-button ${activeTab === 'preview' ? 'active' : ''}`}
                onClick={() => setActiveTab('preview')}
              >
                Preview
              </button>
              <button 
                className={`tab-button ${activeTab === 'parameters' ? 'active' : ''}`}
                onClick={() => setActiveTab('parameters')}
              >
                Parameters
              </button>
            </div>
            
            {activeTab === 'editor' && (
              <div className="editor-container">
                <div className="editor-tabs">
                  {tabs.map(tab => (
                    <div 
                      key={tab.id}
                      className={`editor-tab ${activeTabId === tab.id ? 'active' : ''}`}
                      onClick={() => setActiveTabId(tab.id)}
                    >
                      {tab.label}
                      <button 
                        className="tab-close"
                        onClick={(e) => closeTab(tab.id, e)}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  <button className="new-tab" onClick={createNewTab}>+</button>
                </div>
                
                <div className="editor-actions">
                  <button className="run-button" onClick={executeCode}>
                    ▶ Run
                  </button>
                </div>
                
                <div className="monaco-container" ref={editorContainerRef}></div>
              </div>
            )}
            
            {activeTab === 'preview' && (
              <div className="preview-container">
                <iframe 
                  className="preview-frame"
                  title="Preview"
                  sandbox="allow-scripts"
                  srcDoc={`
                    <!DOCTYPE html>
                    <html>
                      <head>
                        <style>
                          body { font-family: sans-serif; margin: 20px; }
                        </style>
                      </head>
                      <body>
                        <div id="root"></div>
                        <script>
                          ${tabs.find(tab => tab.id === activeTabId)?.content || ''}
                        </script>
                      </body>
                    </html>
                  `}
                ></iframe>
              </div>
            )}
            
            {activeTab === 'parameters' && (
              <div className="parameters-container">
                <div className="parameter-group">
                  <h3>Model Parameters</h3>
                  
                  <div className="parameter">
                    <label>Temperature</label>
                    <input type="range" min="0" max="1" step="0.1" defaultValue="0.7" />
                    <span>0.7</span>
                  </div>
                  
                  <div className="parameter">
                    <label>Max Output Tokens</label>
                    <input type="range" min="100" max="2048" step="100" defaultValue="1024" />
                    <span>1024</span>
                  </div>
                  
                  <div className="parameter">
                    <label>Top P</label>
                    <input type="range" min="0" max="1" step="0.05" defaultValue="0.95" />
                    <span>0.95</span>
                  </div>
                  
                  <div className="parameter">
                    <label>Top K</label>
                    <input type="range" min="1" max="40" step="1" defaultValue="40" />
                    <span>40</span>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Console Output */}
          <div className="console-panel">
            <div className="console-header">
              <span>Console</span>
              <button onClick={() => setConsoleMessages([
                { type: 'info', content: 'Console cleared', timestamp: new Date().toISOString() }
              ])}>
                Clear
              </button>
            </div>
            <div className="console-output">
              {consoleMessages.map((msg, i) => (
                <div key={i} className={`console-message ${msg.type}`}>
                  <span className="timestamp">{new Date(msg.timestamp).toLocaleTimeString()}</span>
                  <span className="content">{msg.content}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
