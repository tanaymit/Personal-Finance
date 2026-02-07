'use client';

import { useEffect, useRef, useState } from 'react';
import { sendAssistantChat } from '@/lib/api';
import { RotateCcw } from 'lucide-react';

type ChatMsg = {
  role: 'user' | 'assistant';
  content: string;
};

const INITIAL_MESSAGE: ChatMsg = {
  role: 'assistant',
  content:
    "Ask me about your spending, budget status, top categories, or affordability. Example: 'Can I afford a $200 dinner this month?'",
};

export default function AssistantPage() {
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

  const handleRestart = () => {
    if (window.confirm('Are you sure you want to clear the chat history?')) {
      setMessages([INITIAL_MESSAGE]);
      localStorage.setItem('assistantMessages', JSON.stringify([INITIAL_MESSAGE]));
    }
  };

  if (!isLoaded) {
    return (
      <div className="p-6 space-y-6 max-w-4xl">
        <div className="h-[60vh] bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-100 mb-2">Assistant</h1>
          <p className="text-slate-400 text-sm">Defaults to the current month if you don't specify a period.</p>
        </div>
        <button
          onClick={handleRestart}
          className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg transition-colors border border-slate-800"
          title="Clear chat history"
        >
          <RotateCcw size={16} />
          Restart
        </button>
      </div>

      <div className="bg-slate-950 border border-slate-800 rounded-xl">
        <div className="h-[60vh] overflow-auto p-4 space-y-3">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={
                m.role === 'user'
                  ? 'flex justify-end'
                  : 'flex justify-start'
              }
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
          {isSending && (
            <div className="text-sm text-slate-400">Thinking…</div>
          )}
          <div ref={endRef} />
        </div>

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
      </div>
    </div>
  );
}
