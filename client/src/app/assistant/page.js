'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { Send, Bot, User, RotateCcw, ExternalLink, Target, Moon, Sun, ArrowRight, BarChart3, Activity, X, Zap, Leaf } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import ActivityModal from '@/components/ActivityModal';

// Mission Detail Modal Component
function MissionDetailModal({ mission, onClose, onNavigate }) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full p-6 animate-scale-in" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{mission.name}</h3>
            <div className="flex gap-2 mt-2">
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                mission.difficulty === 'Mudah' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                mission.difficulty === 'Sedang' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' :
                mission.difficulty === 'Sulit' ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400' :
                'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
              }`}>
                {mission.difficulty}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400">
                {mission.category}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <X size={24} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">Deskripsi</h4>
            <p className="text-gray-700 dark:text-gray-300">{mission.description}</p>
          </div>

          {mission.tips && (
            <div>
              <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">💡 Tips</h4>
              <p className="text-gray-700 dark:text-gray-300 italic">{mission.tips}</p>
            </div>
          )}

          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 p-4 rounded-xl border border-emerald-200 dark:border-emerald-700">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">Reward</span>
              <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">+{mission.xp} XP</span>
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-200 dark:hover:bg-gray-600 transition"
          >
            Tutup
          </button>
          <button
            onClick={onNavigate}
            className="flex-1 px-4 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-semibold hover:shadow-lg transition flex items-center justify-center gap-2"
          >
            <Target size={18} />
            Lihat Semua Misi
          </button>
        </div>
      </div>
    </div>
  );
}

// Stats Card Modal Component
function StatsModal({ user, onClose }) {
  const netImpact = (user.co2_saved || 0) - (user.total_emission || 0);
  
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full p-6 animate-scale-in" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100">📊 Statistik Kamu</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <X size={24} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-4 rounded-xl border border-blue-200 dark:border-blue-700">
            <div className="text-sm font-semibold text-blue-600 dark:text-blue-400 mb-1">Level</div>
            <div className="text-3xl font-black text-blue-700 dark:text-blue-300">{user.level || user.current_level || 1}</div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-4 rounded-xl border border-purple-200 dark:border-purple-700">
            <div className="text-sm font-semibold text-purple-600 dark:text-purple-400 mb-1">Total XP</div>
            <div className="text-3xl font-black text-purple-700 dark:text-purple-300">{user.total_xp || 0}</div>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 p-4 rounded-xl border border-orange-200 dark:border-orange-700">
            <div className="text-sm font-semibold text-orange-600 dark:text-orange-400 mb-1">🔥 Streak</div>
            <div className="text-3xl font-black text-orange-700 dark:text-orange-300">{user.current_streak || 0} hari</div>
          </div>

          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 p-4 rounded-xl border border-emerald-200 dark:border-emerald-700">
            <div className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 mb-1">CO2 Saved</div>
            <div className="text-2xl font-black text-emerald-700 dark:text-emerald-300">{(user.co2_saved || 0).toFixed(1)} kg</div>
          </div>
        </div>

        <div className={`mt-4 p-4 rounded-xl border-2 ${
          netImpact >= 0 
            ? 'bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20 border-teal-300 dark:border-teal-700' 
            : 'bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border-red-300 dark:border-red-700'
        }`}>
          <div className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">Net Impact</div>
          <div className={`text-3xl font-black ${netImpact >= 0 ? 'text-teal-700 dark:text-teal-300' : 'text-red-700 dark:text-red-300'}`}>
            {netImpact >= 0 ? '+' : ''}{netImpact.toFixed(1)} kg CO2
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
            {netImpact >= 0 ? '🌱 Keren! Kamu berkontribusi positif untuk bumi!' : '⚠️ Ayo tingkatkan aktivitas hijau kamu!'}
          </p>
        </div>

        <button
          onClick={onClose}
          className="w-full mt-6 px-4 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-semibold hover:shadow-lg transition"
        >
          Tutup
        </button>
      </div>
    </div>
  );
}

// Component untuk action buttons dari AI
function ActionButton({ action, onExecute }) {
  const getButtonConfig = () => {
    switch (action.action) {
      case 'toggleTheme':
        return {
          icon: <Moon size={16} />,
          label: 'Ubah Tema',
          color: 'from-purple-500 to-indigo-600'
        };
      case 'navigate':
        return {
          icon: <ArrowRight size={16} />,
          label: `Buka ${action.url}`,
          color: 'from-blue-500 to-cyan-600'
        };
      case 'showMission':
        return {
          icon: <Target size={16} />,
          label: action.name ? `Lihat: ${action.name}` : 'Lihat Misi',
          color: 'from-emerald-500 to-teal-600'
        };
      case 'showStats':
        return {
          icon: <BarChart3 size={16} />,
          label: 'Lihat Statistik',
          color: 'from-blue-500 to-purple-600'
        };
      case 'logActivity':
        return {
          icon: <Activity size={16} />,
          label: 'Catat Aktivitas',
          color: 'from-green-500 to-emerald-600'
        };
      default:
        return {
          icon: <ArrowRight size={16} />,
          label: 'Action',
          color: 'from-gray-500 to-gray-600'
        };
    }
  };

  const config = getButtonConfig();

  return (
    <button
      onClick={() => onExecute(action)}
      className={`inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r ${config.color} text-white rounded-lg font-semibold shadow-md hover:shadow-lg transition-all hover:scale-105 mt-2`}
    >
      {config.icon}
      {config.label}
    </button>
  );
}

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
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([DEFAULT_MESSAGE]);
  const [loading, setLoading] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [user, setUser] = useState(null);
  const [showMissionModal, setShowMissionModal] = useState(false);
  const [currentMission, setCurrentMission] = useState(null);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  // Handler untuk execute actions dari AI
  const executeAction = (action) => {
    console.log('Executing action:', action);
    
    switch (action.action) {
      case 'toggleTheme':
        toggleTheme();
        // Add confirmation message
        setMessages(prev => [...prev, {
          role: 'bot',
          text: `✅ Tema berhasil diubah ke ${theme === 'light' ? 'Dark' : 'Light'} Mode!`
        }]);
        break;
        
      case 'navigate':
        router.push(action.url);
        break;
        
      case 'showMission':
        if (action.name && action.category && action.difficulty && action.xp && action.description) {
          setCurrentMission(action);
          setShowMissionModal(true);
        } else {
          router.push('/missions');
        }
        break;
      
      case 'showStats':
        setShowStatsModal(true);
        break;
      
      case 'logActivity':
        setShowActivityModal(true);
        break;
        
      default:
        console.log('Unknown action:', action.action);
    }
  };

  // Handler for activity logged
  const handleActivityLogged = (activity) => {
    setShowActivityModal(false);
    setMessages(prev => [...prev, {
      role: 'bot',
      text: `✅ Aktivitas "${activity.name}" berhasil dicatat! Kamu mendapat +${activity.xp} XP!`
    }]);
  };

  // Load user data and chat history
  useEffect(() => {
    setIsClient(true);
    
    // Load user data
    const userData = JSON.parse(localStorage.getItem('user'));
    if (userData) {
      setUser(userData);
    }
    
    // Load chat history
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
  }, []);

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
      // 2. Prepare user context
      const userContext = user ? {
        level: user.level || user.current_level || 1,
        totalXp: user.total_xp || 0,
        streak: user.current_streak || 0,
        co2Saved: user.co2_saved || 0,
        totalEmission: user.total_emission || 0
      } : null;

      // 3. Prepare chat history (current messages before the new user message)
      const chatHistory = messages.map(msg => ({
        role: msg.role,
        text: msg.text
      }));

      // 4. Kirim ke Backend AI dengan context dan chat history
      const res = await fetch(`${API_URL}/ai/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          question: userMessage.text,
          userContext,
          chatHistory // Include conversation history
        })
      });
      
      const data = await res.json();

      // 5. Tambahkan balasan Bot dengan actions
      setMessages(prev => [...prev, { 
        role: 'bot', 
        text: data.answer,
        actions: data.actions || []
      }]);
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
                <div className={`flex flex-col gap-2`}>
                  <div className={`px-4 py-3 rounded-2xl text-base leading-relaxed shadow-md whitespace-pre-wrap ${
                    msg.role === 'user' 
                      ? 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-tr-sm border border-gray-100 dark:border-gray-700' 
                      : 'bg-gradient-to-br from-emerald-600 to-teal-600 text-white rounded-tl-sm'
                  }`}>
                    <MessageContent text={msg.text} isBot={msg.role === 'bot'} />
                  </div>
                  
                  {/* Action Buttons (hanya untuk bot messages) */}
                  {msg.role === 'bot' && msg.actions && msg.actions.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {msg.actions.map((action, actionIdx) => (
                        <ActionButton 
                          key={actionIdx} 
                          action={action} 
                          onExecute={executeAction}
                        />
                      ))}
                    </div>
                  )}
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

      {/* Mission Detail Modal */}
      {showMissionModal && currentMission && (
        <MissionDetailModal 
          mission={currentMission}
          onClose={() => {
            setShowMissionModal(false);
            setCurrentMission(null);
          }}
          onNavigate={() => {
            setShowMissionModal(false);
            setCurrentMission(null);
            router.push('/missions');
          }}
        />
      )}

      {/* Stats Modal */}
      {showStatsModal && user && (
        <StatsModal 
          user={user}
          onClose={() => setShowStatsModal(false)}
        />
      )}

      {/* Activity Modal */}
      {showActivityModal && user && (
        <ActivityModal 
          isOpen={showActivityModal}
          onClose={() => setShowActivityModal(false)}
          userId={user.id}
          onRefresh={() => {
            // Refresh user data after activity logged
            const userData = JSON.parse(localStorage.getItem('user'));
            if (userData) setUser(userData);
          }}
          onActivityLogged={handleActivityLogged}
        />
      )}
    </div>
  );
}