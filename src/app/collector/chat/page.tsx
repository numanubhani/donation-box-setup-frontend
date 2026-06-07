'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useAppStore, useAuthStore } from '@/store/useStore';
import { Send, MessageSquare, Check, CheckCheck } from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils';

export default function CollectorChatPage() {
  const { currentUserId } = useAuthStore();
  const { collectors, messages, sendMessage, markMessagesAsRead } = useAppStore();
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const currentCollector = useMemo(() => {
    return collectors.find((c) => c.id === currentUserId);
  }, [collectors, currentUserId]);

  // Mark admin messages as read when collector opens chat
  useEffect(() => {
    if (currentUserId) {
      const hasUnread = messages.some(
        (m) => m.senderId === 'admin' && m.receiverId === currentUserId && !m.isRead
      );
      if (hasUnread) {
        markMessagesAsRead(currentUserId, 'collector');
      }
    }
  }, [currentUserId, messages, markMessagesAsRead]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Filter messages for this collector and admin
  const currentChatMessages = useMemo(() => {
    if (!currentUserId) return [];
    return messages.filter(
      (m) =>
        (m.senderId === 'admin' && m.receiverId === currentUserId) ||
        (m.senderId === currentUserId && m.receiverId === 'admin')
    ).sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  }, [messages, currentUserId]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !currentUserId || !currentCollector) return;

    sendMessage(inputText.trim(), currentUserId, 'admin', currentCollector.name);
    setInputText('');
  };

  if (!currentCollector) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-2 border-emerald-800 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-card h-[calc(100vh-140px)] flex flex-col overflow-hidden max-w-4xl mx-auto">
      {/* Header Info */}
      <div className="p-4 bg-white border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-800 flex items-center justify-center p-1.5 shadow-md shadow-emerald-800/20">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="ANSCF Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900 font-sora">
              ANSCF Admin Support
            </h3>
            <p className="text-[10px] text-slate-400">Live chat with admin support</p>
          </div>
        </div>
        <span className="w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full animate-pulse" />
      </div>

      {/* Messages Thread */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/50">
        {currentChatMessages.map((msg) => {
          const isMe = msg.senderId === currentUserId;
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className="max-w-[75%]">
                <div
                  className={`rounded-2xl px-4 py-2 text-sm shadow-sm ${
                    isMe
                      ? 'bg-emerald-800 text-white rounded-tr-none'
                      : 'bg-white text-slate-800 border border-slate-100 rounded-tl-none'
                  }`}
                >
                  <p className="leading-relaxed break-words">{msg.content}</p>
                </div>
                <div className={`flex items-center gap-1 mt-1 text-[9px] text-slate-400 ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <span>{formatRelativeTime(msg.timestamp)}</span>
                  {isMe && (
                    msg.isRead ? <CheckCheck size={11} className="text-sky-500" /> : <Check size={11} />
                  )}
                </div>
              </div>
            </div>
          );
        })}
        
        {currentChatMessages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 py-12">
            <MessageSquare size={36} className="opacity-40 mb-2" />
            <p className="text-xs">No support messages yet. Ask a question to Admin.</p>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Box */}
      <form onSubmit={handleSend} className="p-4 bg-white border-t border-slate-100 flex gap-2">
        <input
          type="text"
          className="input-field text-sm flex-1"
          placeholder="Ask Admin about boxes, schedules, or payments..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
        />
        <button
          type="submit"
          disabled={!inputText.trim()}
          className="btn-primary bg-emerald-800 hover:bg-emerald-900 active:bg-emerald-950 px-4 flex-shrink-0"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}
