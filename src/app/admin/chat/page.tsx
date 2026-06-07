'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useAppStore } from '@/store/useStore';
import { Send, User, MessageSquare, Check, CheckCheck } from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils';

export default function AdminChatPage() {
  const { collectors, messages, sendMessage, markMessagesAsRead } = useAppStore();
  const [selectedCollectorId, setSelectedCollectorId] = useState<string | null>(null);
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Filter out collectors to show only active ones
  const activeCollectors = useMemo(() => {
    return collectors.filter((c) => c.status === 'active');
  }, [collectors]);

  // If no collector is selected but we have active collectors, auto-select the first one
  useEffect(() => {
    if (!selectedCollectorId && activeCollectors.length > 0) {
      setSelectedCollectorId(activeCollectors[0].id);
    }
  }, [activeCollectors, selectedCollectorId]);

  // Mark messages as read when opening a collector conversation
  useEffect(() => {
    if (!selectedCollectorId) return;
    const hasUnread = messages.some(
      (m) => m.senderId === selectedCollectorId && m.receiverId === 'admin' && !m.isRead
    );
    if (hasUnread) {
      markMessagesAsRead(selectedCollectorId, 'admin');
    }
  }, [selectedCollectorId, messages, markMessagesAsRead]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, selectedCollectorId]);

  const selectedCollector = useMemo(() => {
    return collectors.find((c) => c.id === selectedCollectorId);
  }, [collectors, selectedCollectorId]);

  const currentChatMessages = useMemo(() => {
    if (!selectedCollectorId) return [];
    return messages.filter(
      (m) =>
        (m.senderId === 'admin' && m.receiverId === selectedCollectorId) ||
        (m.senderId === selectedCollectorId && m.receiverId === 'admin')
    ).sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  }, [messages, selectedCollectorId]);

  // Get unread counts for each collector
  const getUnreadCount = (collectorId: string) => {
    if (collectorId === selectedCollectorId) return 0;
    return messages.filter(
      (m) => m.senderId === collectorId && m.receiverId === 'admin' && !m.isRead
    ).length;
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !selectedCollectorId) return;

    sendMessage(inputText.trim(), 'admin', selectedCollectorId, 'Admin');
    setInputText('');
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-card h-[calc(100vh-140px)] flex overflow-hidden">
      {/* Sidebar List */}
      <div className="w-full md:w-80 border-r border-slate-100 flex flex-col flex-shrink-0">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
          <h2 className="font-semibold text-slate-900 font-sora text-sm flex items-center gap-2">
            <MessageSquare size={16} className="text-emerald-700" />
            Collector Support Chats
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Live messages via WebSocket</p>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
          {activeCollectors.map((collector) => {
            const isSelected = collector.id === selectedCollectorId;
            const unreadCount = getUnreadCount(collector.id);
            const lastMsg = messages
              .filter(
                (m) =>
                  (m.senderId === 'admin' && m.receiverId === collector.id) ||
                  (m.senderId === collector.id && m.receiverId === 'admin')
              )
              .sort((a, b) => b.timestamp.localeCompare(a.timestamp))[0];

            return (
              <button
                key={collector.id}
                onClick={() => setSelectedCollectorId(collector.id)}
                className={`w-full flex items-center gap-3 p-4 text-left transition-colors hover:bg-slate-50 ${
                  isSelected ? 'bg-slate-50 border-l-4 border-emerald-800 pl-3' : ''
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0 relative">
                  <User size={18} className="text-slate-500" />
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className={`text-sm font-semibold truncate ${isSelected ? 'text-emerald-900' : 'text-slate-800'}`}>
                      {collector.name}
                    </p>
                    {lastMsg && (
                      <span className="text-[10px] text-slate-400">
                        {formatRelativeTime(lastMsg.timestamp)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-xs text-slate-400 truncate max-w-[140px]">
                      {lastMsg ? lastMsg.content : `No messages yet`}
                    </p>
                    {unreadCount > 0 && (
                      <span className="bg-red-500 text-white font-bold text-[9px] w-4.5 h-4.5 flex items-center justify-center rounded-full px-1">
                        {unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
          {activeCollectors.length === 0 && (
            <p className="text-center text-slate-400 text-sm py-12">No active collectors found.</p>
          )}
        </div>
      </div>

      {/* Chat Conversation Box */}
      <div className="flex-1 flex flex-col bg-slate-50/50">
        {selectedCollector ? (
          <>
            {/* Header info */}
            <div className="p-4 bg-white border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-emerald-50 flex items-center justify-center">
                  <span className="text-sm font-bold text-emerald-800">
                    {selectedCollector.name.split(' ').map((n) => n[0]).join('')}
                  </span>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 font-sora">
                    {selectedCollector.name}
                  </h3>
                  <p className="text-[10px] text-slate-400">{selectedCollector.area} · Active Now</p>
                </div>
              </div>
            </div>

            {/* Messages Thread */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3">
              {currentChatMessages.map((msg) => {
                const isAdmin = msg.senderId === 'admin';
                return (
                  <div key={msg.id} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                    <div className="max-w-[70%]">
                      <div
                        className={`rounded-2xl px-4 py-2 text-sm shadow-sm ${
                          isAdmin
                            ? 'bg-emerald-800 text-white rounded-tr-none'
                            : 'bg-white text-slate-800 border border-slate-100 rounded-tl-none'
                        }`}
                      >
                        <p className="leading-relaxed break-words">{msg.content}</p>
                      </div>
                      <div className={`flex items-center gap-1 mt-1 text-[9px] text-slate-400 ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                        <span>{formatRelativeTime(msg.timestamp)}</span>
                        {isAdmin && (
                          msg.isRead ? <CheckCheck size={11} className="text-sky-500" /> : <Check size={11} />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {currentChatMessages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-slate-400">
                  <MessageSquare size={32} className="opacity-40 mb-2" />
                  <p className="text-xs">Send a message to start conversation</p>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input Box */}
            <form onSubmit={handleSend} className="p-4 bg-white border-t border-slate-100 flex gap-2">
              <input
                type="text"
                className="input-field text-sm flex-1"
                placeholder={`Type a message to ${selectedCollector.name}...`}
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
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
            <MessageSquare size={48} className="opacity-30 mb-2" />
            <p className="text-sm">Select a collector to start chatting</p>
          </div>
        )}
      </div>
    </div>
  );
}
