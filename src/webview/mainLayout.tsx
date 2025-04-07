import * as React from 'react';
import { useState, useEffect } from 'react';
import { ChatPanel } from './chatPanel';
// Import other components as needed

export const MainLayout: React.FC = () => {
  const [chatPanelWidth, setChatPanelWidth] = useState(300);
  const [isDragging, setIsDragging] = useState(false);
  
  // Handle resize functionality
  const handleResizeStart = () => {
    setIsDragging(true);
  };
  
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      
      // Calculate new width, with min/max constraints
      const newWidth = Math.min(Math.max(150, e.clientX), window.innerWidth - 300);
      setChatPanelWidth(newWidth);
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
  
  return (
    <div className="app-container">
      <div className="top-bar">
        {/* Additional top bar elements could go here */}
      </div>
      
      <div className="main-content">
        <div className="panel-container">
          <div className="panel chat-panel" style={{ width: `${chatPanelWidth}px` }}>
            <ChatPanel />
          </div>
          
          <div 
            className="resize-handle" 
            onMouseDown={handleResizeStart}
          ></div>
          
          <div className="panel editor-panel">
            <div className="tab-list">
              <div className="tab active">
                main.js
                <button className="tab-close">×</button>
              </div>
              <div className="tab">
                index.html
                <button className="tab-close">×</button>
              </div>
            </div>
            <div className="editor-content">
              {/* Monaco Editor would be integrated here */}
              <div style={{ padding: 20, color: '#ddd' }}>
                Code Editor Placeholder<br/>
                (Monaco Editor would go here)
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="console-panel">
        <div className="panel-header">Console</div>
        <div className="console-content">
          <div className="log-line">> Console initialized</div>
          <div className="log-line">> Ready to execute code</div>
        </div>
      </div>
    </div>
  );
};
