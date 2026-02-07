'use client';

import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { sendAssistantChat } from '@/lib/api';

type ChatMsg = {
  role: 'user' | 'assistant';
  content: string;
};

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const INITIAL_MESSAGE: ChatMsg = {
  role: 'assistant',
  content: "Ask me about your spending, budget status, top categories, or affordability. Example: 'Can I afford a $200 dinner this month?'",
};

export function ChatModal({ isOpen, onClose }: ChatModalProps) {
  const [messages, setMessages] = useState<ChatMsg[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const endRef = useRef<HTMLDivElement | null>(null);

  // Load messages from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('assistantMessages');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setMessages(parsed);
      } catch (e) {
        console.error('Failed to parse stored messages:', e);
        setMessages([INITIAL_MESSAGE]);
      }
    }
    setIsLoaded(true);
  }, []);

  // Save messages to localStorage whenever they change
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('assistantMessages', JSON.stringify(messages));
    }
  }, [messages, isLoaded]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSending]);

  async function onSend() {
    const text = input.trim();
    if (!text || isSending) return;

    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: text }]);
    setIsSending(true);

    try {
      const res = await sendAssistantChat({ message: text });
      setMessages((prev) => [...prev, { role: 'assistant', content: res.answer }]);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : null;
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            message || 'Sorry — I had trouble reaching the assistant backend. Is FastAPI running?',
        },
      ]);
    } finally {
      setIsSending(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-950 border border-slate-800 rounded-xl w-full max-w-2xl h-[70vh] flex flex-col shadow-[0_0_40px_rgba(2,6,23,0.6)]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <h2 className="text-lg font-semibold text-slate-100">Finance Assistant</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-900 rounded-lg transition-colors"
          >
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        {/* Chat Area */}
        {isLoaded && (
          <>
            <div className="flex-1 overflow-auto p-4 space-y-3">
              {messages.map((m, idx) => (
                <div
                  key={idx}
                  className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}
                >
                  <div
                    className={
                      m.role === 'user'
                        ? 'max-w-[85%] rounded-lg px-3 py-2 bg-cyan-500 text-slate-950'
                        : 'max-w-[85%] rounded-lg px-3 py-2 bg-slate-900/70 text-slate-100 border border-slate-800'
                    }
                  >
                    <pre className="whitespace-pre-wrap font-sans text-sm leading-5">
                      {m.content}
                    </pre>
                  </div>
                </div>
              ))}
              {isSending && <div className="text-sm text-slate-400">Thinking…</div>}
              <div ref={endRef} />
            </div>

            {/* Input Area */}
            <div className="border-t border-slate-800 p-3 flex gap-2">
              <input
                className="flex-1 px-4 py-3 border border-slate-800 rounded-lg bg-slate-900/70 text-slate-100 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 text-sm"
                value={input}
                placeholder="Type a question…"
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') onSend();
                }}
                disabled={isSending}
              />
              <button
                className="px-6 py-2 bg-cyan-500 text-slate-950 rounded-lg hover:bg-cyan-400 disabled:bg-cyan-800 transition-colors font-medium text-sm"
                onClick={onSend}
                disabled={isSending || !input.trim()}
              >
                Send
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
