'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { Send, Bot, User, RotateCcw, ExternalLink } from 'lucide-react';

// Component untuk parsing pesan dengan link interaktif
function MessageContent({ text, isBot }) {
  const router = useRouter();
  
  if (!isBot) {
    return <span>{text}</span>;
  }

  // Parse markdown-style links: [Text](/url)
  const parts = [];
  let lastIndex = 0;
  const linkRegex = /\[([^\]]+)\]\(([^\)]+)\)/g;
  let match;

  while ((match = linkRegex.exec(text)) !== null) {
    const [fullMatch, linkText, url] = match;
    const startIndex = match.index;
    
    // Add text before link
    if (startIndex > lastIndex) {
      parts.push(
        <span key={`text-${lastIndex}`}>
          {text.substring(lastIndex, startIndex)}
        </span>
      );
    }
    
    // Add clickable link
    parts.push(
      <button
        key={`link-${startIndex}`}
        onClick={() => router.push(url)}
        className="inline-flex items-center gap-1 px-2 py-0.5 bg-white/20 hover:bg-white/30 dark:bg-white/10 dark:hover:bg-white/20 rounded-md font-bold underline transition-all hover:scale-105 border border-white/30 dark:border-white/20"
      >
        {linkText}
        <ExternalLink size={14} />
      </button>
    );
    
    lastIndex = startIndex + fullMatch.length;
  }
  
  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(
      <span key={`text-${lastIndex}`}>
        {text.substring(lastIndex)}
      </span>
    );
  }
  
  // If no links found, parse bold text
  if (parts.length === 0) {
    const boldRegex = /\*\*([^\*]+)\*\*/g;
    const textParts = text.split(boldRegex);
    
    return (
      <>
        {textParts.map((part, idx) => 
          idx % 2 === 1 ? (
            <strong key={idx} className="font-extrabold text-yellow-200">{part}</strong>
          ) : (
            <span key={idx}>{part}</span>
          )
        )}
      </>
    );
  }
  
  return <>{parts}</>;
}

const STORAGE_KEY = 'ecobot_chat_history';
const DEFAULT_MESSAGE = { role: 'bot', text: 'Halo! Saya EcoBot 🌱, asisten resmi CarbonTrack!\n\nAku bisa bantu kamu dengan:\n• Tips hemat energi & lingkungan\n• Panduan fitur aplikasi\n• Cara naik level & dapat badge\n\nAda yang bisa dibantu?' };

// Quick suggestion buttons
const QUICK_SUGGESTIONS = [
  { icon: '⚙️', text: 'Cara ganti username?', query: 'Bagaimana cara mengganti username?' },
  { icon: '🎯', text: 'Cara naik level?', query: 'Bagaimana cara naik level?' },
  { icon: '🏆', text: 'Cara dapat badge?', query: 'Bagaimana cara mendapatkan badge?' },
  { icon: '🔥', text: 'Apa itu streak?', query: 'Bagaimana cara mendapatkan streak?' },
  { icon: '💡', text: 'Tips hemat listrik', query: 'Berikan tips hemat energi listrik' },
  { icon: '🚗', text: 'Tips transportasi', query: 'Berikan tips transportasi ramah lingkungan' }
];

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
  
  const sendMessage = async (messageText) => {
    if (!messageText.trim()) return;

    const API_URL = process.env.NEXT_PUBLIC_API_URL;

    // 1. Tambahkan pesan user ke chat
    const userMessage = { role: 'user', text: messageText };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      // 2. Kirim ke Backend AI
      const res = await fetch(`${API_URL}/ai/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: userMessage.text })
      });
      
      const data = await res.json();

      // 3. Tambahkan balasan Bot
      setMessages(prev => [...prev, { role: 'bot', text: data.answer }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'bot', text: 'Maaf, EcoBot sedang pusing (Server Error). 😵' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    await sendMessage(input);
  };

  const handleQuickSuggestion = (query) => {
    sendMessage(query);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex">
      <Sidebar />
      <main className="flex-1 p-0 ml-64 flex flex-col h-screen">
        
        {/* Header Chat - Lebih Compact */}
        <div className="bg-white dark:bg-gray-800 px-6 py-4 shadow-sm border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl text-white shadow-md">
              <Bot size={24} />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-800 dark:text-gray-100">EcoBot Assistant</h1>
              <p className="text-xs text-green-600 dark:text-green-400 font-medium flex items-center gap-1.5">
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
        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-3 dark:bg-gray-900">
          
          {/* Quick Suggestions - Only show if first message */}
          {messages.length === 1 && (
            <div className="max-w-2xl mx-auto mb-4">
              <p className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-3 text-center">💬 Pertanyaan Cepat:</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {QUICK_SUGGESTIONS.map((suggestion, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleQuickSuggestion(suggestion.query)}
                    disabled={loading}
                    className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-800 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 border-2 border-gray-200 dark:border-gray-700 hover:border-emerald-300 dark:hover:border-emerald-600 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 transition-all hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="text-lg">{suggestion.icon}</span>
                    <span className="text-left">{suggestion.text}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex items-start gap-2.5 max-w-2xl ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                
                {/* Avatar */}
                <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm ${
                  msg.role === 'user' 
                    ? 'bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 text-gray-700 dark:text-gray-200' 
                    : 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white'
                }`}>
                  {msg.role === 'user' ? <User size={18} /> : <Bot size={18} />}
                </div>

                {/* Message Bubble */}
                <div className={`px-4 py-3 rounded-2xl text-base leading-relaxed shadow-md whitespace-pre-wrap ${
                  msg.role === 'user' 
                    ? 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-tr-sm border border-gray-100 dark:border-gray-700' 
                    : 'bg-gradient-to-br from-emerald-600 to-teal-600 text-white rounded-tl-sm'
                }`}>
                  <MessageContent text={msg.text} isBot={msg.role === 'bot'} />
                </div>
              </div>
            </div>
          ))}
          
          {/* Loading Indicator */}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-4 py-2 rounded-full text-xs font-medium animate-pulse shadow-sm">
                💬 EcoBot sedang mengetik...
              </div>
            </div>
          )}
          
          {/* Scroll anchor - invisible element at bottom */}
          <div ref={messagesEndRef} className="h-1" />
        </div>

        {/* Input Area - Auto-resize Textarea */}
        <div className="px-4 py-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-t border-gray-100 dark:border-gray-700">
          <form onSubmit={handleSend} className="flex gap-2 max-w-3xl mx-auto items-end">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="💬 Tanya tips hemat energi... (Shift+Enter untuk baris baru)"
              rows={1}
              className="flex-1 px-4 py-3 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-600 rounded-2xl focus:ring-2 focus:ring-emerald-400 focus:border-transparent outline-none transition-all text-base resize-none overflow-y-auto min-h-[48px] max-h-[200px] scrollbar-auto-hide placeholder:text-gray-400 dark:placeholder:text-gray-500"
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
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-2">
            Tekan <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded text-xs">Enter</kbd> untuk kirim, 
            <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded text-xs ml-1">Shift+Enter</kbd> untuk baris baru
          </p>
        </div>

      </main>
    </div>
  );
}