'use client';

import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { Send, Bot, User } from 'lucide-react';

export default function AssistantPage() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    { role: 'bot', text: 'Halo! Saya EcoBot 🌱. Tanyakan tips hemat listrik, transportasi, atau cara mengurangi sampah plastik!' }
  ]);
  const [loading, setLoading] = useState(false);
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    // 1. Tambahkan pesan user ke chat
    const userMessage = { role: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      // 2. Kirim ke Backend AI
      const res = await fetch(`${API_URL}/api/ai/ask`, {
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
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <main className="flex-1 ml-64 flex flex-col h-screen">
        
        {/* Header Chat */}
        <div className="bg-white p-6 shadow-sm border-b border-gray-200 flex items-center gap-3">
          <div className="p-2 bg-emerald-100 rounded-full text-emerald-600">
            <Bot size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800">AI Eco Assistant</h1>
            <p className="text-xs text-green-500 font-medium flex items-center gap-1">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span> Online
            </p>
          </div>
        </div>

        {/* Area Chat Bubble */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex items-start gap-3 max-w-lg ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-gray-200 text-gray-600' : 'bg-emerald-600 text-white'}`}>
                  {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                </div>
                <div className={`p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${
                  msg.role === 'user' 
                    ? 'bg-white text-gray-800 rounded-tr-none' 
                    : 'bg-emerald-600 text-white rounded-tl-none'
                }`}>
                  {msg.text}
                </div>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-emerald-50 text-emerald-600 px-4 py-2 rounded-full text-xs animate-pulse">
                EcoBot sedang mengetik...
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white border-t border-gray-200">
          <form onSubmit={handleSend} className="flex gap-2 max-w-4xl mx-auto">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Tanya tips hemat energi..."
              className="flex-1 px-5 py-3 bg-gray-100 border-0 rounded-full focus:ring-2 focus:ring-emerald-500 outline-none transition"
            />
            <button 
              type="submit" 
              disabled={loading}
              className="bg-emerald-600 hover:bg-emerald-700 text-white p-3 rounded-full shadow-lg transition disabled:opacity-50"
            >
              <Send size={20} />
            </button>
          </form>
        </div>

      </main>
    </div>
  );
}