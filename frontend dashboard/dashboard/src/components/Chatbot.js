import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, ArrowLeft, Trash2, Download, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getChatResponse, getFallbackResponse } from '../services/openaiService';

const Chatbot = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = React.useState([]);
  const [input, setInput] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [useAI, setUseAI] = useState(true);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const generateBotResponse = async (userMessage) => {
    if (useAI) {
      try {
        // Use real LLM
        const response = await getChatResponse(userMessage, messages);
        setIsOnline(true);
        return response;
      } catch (error) {
        console.error('LLM Error:', error);
        setIsOnline(false);
        // Fall back to predefined responses
        return getFallbackResponse(userMessage);
      }
    } else {
      // Use fallback responses
      return getFallbackResponse(userMessage);
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = {
      id: messages.length + 1,
      text: input.trim(),
      sender: 'user',
      timestamp: new Date().toLocaleTimeString()
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = input.trim();
    setInput('');
    setLoading(true);

    try {
      const botResponseText = await generateBotResponse(currentInput);
      
      // Simulate realistic typing delay based on response length
      const typingDelay = Math.min(Math.max(botResponseText.length * 20, 1000), 3000);
      
      setTimeout(() => {
        const botResponse = {
          id: messages.length + 2,
          text: botResponseText,
          sender: 'bot',
          timestamp: new Date().toLocaleTimeString()
        };
        
        setMessages(prev => [...prev, botResponse]);
        setLoading(false);
      }, typingDelay);
    } catch (error) {
      console.error('Error generating response:', error);
      setTimeout(() => {
        const errorResponse = {
          id: messages.length + 2,
          text: "I apologize, but I'm experiencing technical difficulties. Please try again in a moment.",
          sender: 'bot',
          timestamp: new Date().toLocaleTimeString()
        };
        setMessages(prev => [...prev, errorResponse]);
        setLoading(false);
      }, 1000);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: 1,
        text: "Chat cleared! I'm ready to help you with any new questions about the footpath monitoring system.",
        sender: 'bot',
        timestamp: new Date().toLocaleTimeString()
      }
    ]);
  };

  const exportChat = () => {
    const chatContent = messages.map(msg => 
      `[${msg.timestamp}] ${msg.sender.toUpperCase()}: ${msg.text}`
    ).join('\n\n');
    
    const blob = new Blob([chatContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat-export-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
  };

  const toggleAIMode = () => {
    setUseAI(!useAI);
    const modeMessage = {
      id: messages.length + 1,
      text: useAI ? 
        "Switched to fallback mode. I'll use predefined responses." : 
        "Switched to AI mode. I'll use advanced language processing.",
      sender: 'bot',
      timestamp: new Date().toLocaleTimeString()
    };
    setMessages(prev => [...prev, modeMessage]);
  };

  return (
    <div className="container" style={{ maxWidth: '1000px' }}>
      <div className="card" style={{ height: 'calc(100vh - 200px)', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1rem',
          borderBottom: '1px solid #eee',
          backgroundColor: '#f8f9fa'
        }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <button
              onClick={() => navigate('/home')}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                marginRight: '1rem',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <ArrowLeft size={20} />
            </button>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{
                backgroundColor: '#6c5ce7',
                color: 'white',
                padding: '8px',
                borderRadius: '50%',
                marginRight: '12px'
              }}>
                <Bot size={20} />
              </div>
              <div>
                <h3 style={{ margin: 0, color: '#2c3e50' }}>AI Assistant</h3>
                <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>
                  {useAI ? 'GPT-Powered' : 'Fallback Mode'} 
                  {!isOnline && <span style={{ color: '#e74c3c' }}> • Offline</span>}
                </p>
              </div>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button
              onClick={toggleAIMode}
              className="btn"
              style={{ 
                backgroundColor: useAI ? '#27ae60' : '#f39c12', 
                color: 'white', 
                display: 'flex', 
                alignItems: 'center',
                fontSize: '12px',
                padding: '6px 12px'
              }}
            >
              {useAI ? 'AI Mode' : 'Basic Mode'}
            </button>
            
            {!isOnline && (
              <div style={{ display: 'flex', alignItems: 'center', color: '#e74c3c' }}>
                <AlertCircle size={16} style={{ marginRight: '4px' }} />
                <span style={{ fontSize: '12px' }}>API Offline</span>
              </div>
            )}
            
            <button
              onClick={exportChat}
              className="btn"
              style={{ backgroundColor: '#3498db', color: 'white', display: 'flex', alignItems: 'center' }}
            >
              <Download size={16} style={{ marginRight: '5px' }} />
              Export
            </button>
            <button
              onClick={clearChat}
              className="btn"
              style={{ backgroundColor: '#e74c3c', color: 'white', display: 'flex', alignItems: 'center' }}
            >
              <Trash2 size={16} style={{ marginRight: '5px' }} />
              Clear
            </button>
          </div>
        </div>

        {/* Messages */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '1rem',
          backgroundColor: '#fafafa'
        }}>
          {messages.map((message) => (
            <div
              key={message.id}
              style={{
                display: 'flex',
                justifyContent: message.sender === 'user' ? 'flex-end' : 'flex-start',
                marginBottom: '1rem'
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                maxWidth: '70%',
                flexDirection: message.sender === 'user' ? 'row-reverse' : 'row'
              }}>
                <div style={{
                  backgroundColor: message.sender === 'user' ? '#007bff' : '#6c5ce7',
                  color: 'white',
                  padding: '8px',
                  borderRadius: '50%',
                  margin: message.sender === 'user' ? '0 0 0 10px' : '0 10px 0 0',
                  minWidth: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {message.sender === 'user' ? <User size={16} /> : <Bot size={16} />}
                </div>
                
                <div>
                  <div style={{
                    backgroundColor: message.sender === 'user' ? '#007bff' : 'white',
                    color: message.sender === 'user' ? 'white' : '#333',
                    padding: '12px 16px',
                    borderRadius: '18px',
                    border: message.sender === 'bot' ? '1px solid #e0e0e0' : 'none',
                    whiteSpace: 'pre-line',
                    lineHeight: '1.4'
                  }}>
                    {message.text}
                  </div>
                  <div style={{
                    fontSize: '12px',
                    color: '#666',
                    marginTop: '4px',
                    textAlign: message.sender === 'user' ? 'right' : 'left'
                  }}>
                    {message.timestamp}
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {loading && (
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={{
                backgroundColor: '#6c5ce7',
                color: 'white',
                padding: '8px',
                borderRadius: '50%',
                marginRight: '10px'
              }}>
                <Bot size={16} />
              </div>
              <div style={{
                backgroundColor: 'white',
                padding: '12px 16px',
                borderRadius: '18px',
                border: '1px solid #e0e0e0'
              }}>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <div style={{ width: '8px', height: '8px', backgroundColor: '#ccc', borderRadius: '50%', animation: 'typing 1.4s infinite' }}></div>
                  <div style={{ width: '8px', height: '8px', backgroundColor: '#ccc', borderRadius: '50%', animation: 'typing 1.4s infinite 0.2s' }}></div>
                  <div style={{ width: '8px', height: '8px', backgroundColor: '#ccc', borderRadius: '50%', animation: 'typing 1.4s infinite 0.4s' }}></div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div style={{
          padding: '1rem',
          borderTop: '1px solid #eee',
          backgroundColor: 'white'
        }}>
          <div style={{ display: 'flex', gap: '10px' }}>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={useAI ? "Ask me anything about footpath management..." : "Ask me basic questions (AI mode disabled)"}
              style={{
                flex: 1,
                padding: '12px',
                border: '1px solid #ddd',
                borderRadius: '20px',
                resize: 'none',
                outline: 'none',
                fontSize: '14px',
                maxHeight: '80px',
                minHeight: '44px'
              }}
              rows={1}
            />
            <button
              onClick={handleSendMessage}
              disabled={!input.trim() || loading}
              style={{
                backgroundColor: input.trim() && !loading ? '#6c5ce7' : '#ccc',
                color: 'white',
                border: 'none',
                borderRadius: '50%',
                width: '44px',
                height: '44px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
                transition: 'background-color 0.2s'
              }}
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes typing {
          0%, 60%, 100% {
            transform: translateY(0);
          }
          30% {
            transform: translateY(-10px);
          }
        }
      `}</style>
    </div>
  );
};

export default Chatbot;
