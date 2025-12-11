'use client';

import { useState, useEffect, useRef } from 'react';
import Sidebar from '@/components/Sidebar';
import { Send, Bot, User, RotateCcw } from 'lucide-react';

const STORAGE_KEY = 'ecobot_chat_history';
const DEFAULT_MESSAGE = { role: 'bot', text: 'Halo! Saya EcoBot 🌱. Tanyakan tips hemat listrik, transportasi, atau cara mengurangi sampah plastik!' };

export default function AssistantPage() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([DEFAULT_MESSAGE]);
  const [loading, setLoading] = useState(false);
  const [isClient, setIsClient] = useState(false); // Track client-side mounting
  const messagesEndRef = useRef(null); // Ref untuk scroll ke bawah
  const textareaRef = useRef(null); // Ref untuk textarea auto-resize

  // Load chat history HANYA di client-side (after hydration)
  useEffect(() => {
    setIsClient(true); // Mark as client-side
    
    try {
      const savedChat = localStorage.getItem(STORAGE_KEY);
      if (savedChat) {
        const parsed = JSON.parse(savedChat);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
        }
      }
    } catch (error) {
      console.error('Failed to load chat history:', error);
    }
  }, []); // Run once on mount

  // Save chat history ke localStorage setiap kali messages berubah
  useEffect(() => {
    if (isClient && messages.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    }
  }, [messages, isClient]);

  // Auto-scroll ke bawah setiap ada message baru
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [messages, loading]); // Trigger saat messages berubah atau loading state berubah

  // Auto-resize textarea based on content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(200, Math.max(48, textareaRef.current.scrollHeight))}px`;
    }
  }, [input]);

  // Handle new chat - reset ke default message
  const handleNewChat = () => {
    setMessages([DEFAULT_MESSAGE]);
    setInput('');
    localStorage.removeItem(STORAGE_KEY);
  };

  // Handle keyboard shortcuts (Shift+Enter = newline, Enter = send)
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault(); // Prevent default newline
      handleSend(e);
    }
    // Shift+Enter akan default behavior (newline)
  };
  
  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const API_URL = process.env.NEXT_PUBLIC_API_URL;

    // 1. Tambahkan pesan user ke chat
    const userMessage = { role: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      // 2. Kirim ke Backend AI (FIX: API_URL sudah include /api)
      const res = await fetch(`${API_URL}/ai/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: userMessage.text })
      });
      
      const data = await res.json();

      // 3. Tambahkan balasan Bot
      setMessages(prev => [...prev, { role: 'bot', text: data.answer }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'bot', text: 'Maaf, EcoBot sedang pusing (Server Error).' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex">
      <Sidebar />
      <main className="flex-1 p-0 ml-64 flex flex-col h-screen">
        
        {/* Header Chat - Lebih Compact */}
        <div className="bg-white px-6 py-4 shadow-sm border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl text-white shadow-md">
              <Bot size={24} />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-800">EcoBot Assistant</h1>
              <p className="text-xs text-green-600 font-medium flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span> 
                Siap membantu
              </p>
            </div>
          </div>
          
          {/* Tombol Chat Baru */}
          <button
            onClick={handleNewChat}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white text-sm font-medium rounded-full shadow-md transition-all hover:shadow-lg"
            title="Mulai percakapan baru"
          >
            <RotateCcw size={16} />
            <span>Chat Baru</span>
          </button>
        </div>

        {/* Area Chat Bubble - Auto-hide Scrollbar */}
        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-3">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex items-start gap-2.5 max-w-2xl ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                
                {/* Avatar */}
                <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm ${
                  msg.role === 'user' 
                    ? 'bg-gradient-to-br from-gray-100 to-gray-200 text-gray-700' 
                    : 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white'
                }`}>
                  {msg.role === 'user' ? <User size={18} /> : <Bot size={18} />}
                </div>

                {/* Message Bubble */}
                <div className={`px-4 py-3 rounded-2xl text-base leading-relaxed shadow-md whitespace-pre-wrap ${
                  msg.role === 'user' 
                    ? 'bg-white text-gray-800 rounded-tr-sm border border-gray-100' 
                    : 'bg-gradient-to-br from-emerald-600 to-teal-600 text-white rounded-tl-sm'
                }`}>
                  {msg.text}
                </div>
              </div>
            </div>
          ))}
          
          {/* Loading Indicator */}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-emerald-100 text-emerald-700 px-4 py-2 rounded-full text-xs font-medium animate-pulse shadow-sm">
                💬 EcoBot sedang mengetik...
              </div>
            </div>
          )}
          
          {/* Scroll anchor - invisible element at bottom */}
          <div ref={messagesEndRef} className="h-1" />
        </div>

        {/* Input Area - Auto-resize Textarea */}
        <div className="px-4 py-3 bg-white/80 backdrop-blur-sm border-t border-gray-100">
          <form onSubmit={handleSend} className="flex gap-2 max-w-3xl mx-auto items-end">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="💬 Tanya tips hemat energi... (Shift+Enter untuk baris baru)"
              rows={1}
              className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-emerald-400 focus:border-transparent outline-none transition-all text-base resize-none overflow-y-auto min-h-[48px] max-h-[200px] scrollbar-auto-hide"
            />
            <button 
              type="submit" 
              disabled={loading || !input.trim()}
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white p-3 rounded-full shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 h-[48px] w-[48px] flex items-center justify-center"
              title="Kirim pesan (Enter)"
            >
              <Send size={20} />
            </button>
          </form>
          <p className="text-xs text-gray-500 text-center mt-2">
            Tekan <kbd className="px-1.5 py-0.5 bg-gray-200 rounded text-xs">Enter</kbd> untuk kirim, 
            <kbd className="px-1.5 py-0.5 bg-gray-200 rounded text-xs ml-1">Shift+Enter</kbd> untuk baris baru
          </p>
        </div>

      </main>
    </div>
  );
}