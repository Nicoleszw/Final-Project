// ChatBody.jsx
import { useEffect, useRef, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../hooks/useAuth';
import EndChatButton from './EndChatButton';

const badgeColor = {
  joy: 'bg-yellow-400',
  sadness: 'bg-blue-500',
  anger: 'bg-red-500',
  fear: 'bg-purple-500',
  surprise: 'bg-pink-500',
  neutral: 'bg-gray-400',
};

export default function ChatBody({ onChatEnded }) {
  const { token } = useAuth();
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "👋 Hi, I'm here for you. How are you feeling today?",
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [chatEnded, setChatEnded] = useState(false);
  const [endError, setEndError] = useState(null);

  const chatContainerRef = useRef(null);

  const scrollChatToBottom = () => {
    const container = chatContainerRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  };

  useEffect(scrollChatToBottom, [messages]);

  async function sendMessage(e) {
    e.preventDefault();
    if (chatEnded || loading || !input.trim()) return;

    const content = input.trim();
    setInput('');
    setLoading(true);

    const userIdx = messages.length;
    setMessages((prev) => [
      ...prev,
      { role: 'user', content, emotion: null },
      { role: 'assistant', content: '' },
    ]);

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/messages/stream`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'text/event-stream',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ content }),
        }
      );

      if (res.status === 401) throw new Error('unauthorized');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let assistantBuffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        chunk.split('\n\n').forEach((raw) => {
          if (!raw.trim()) return;

          const [head, dataRaw] = raw.includes('\ndata: ')
            ? raw.split('\ndata: ')
            : ['event: message', raw.replace('data: ', '')];

          const evt = head.replace('event: ', '').trim();
          const data = dataRaw;

          if (evt === 'emotion' && data) {
            setMessages((prev) => {
              const updated = [...prev];
              updated[userIdx].emotion = data.trim();
              return updated;
            });
          } else if (evt !== 'end' && data) {
            assistantBuffer += data;
            setMessages((prev) => {
              const updated = [...prev];
              updated[userIdx + 1].content = assistantBuffer;
              return updated;
            });
          }
        });
      }
    } catch (err) {
      setMessages((prev) => {
        const updated = [...prev];
        updated[userIdx + 1].content =
          err.message === 'unauthorized'
            ? '⚠️ Session expired. Please log in again.'
            : '⚠️ Connection error';
        return updated;
      });
    } finally {
      setLoading(false);
    }
  }

  async function endChatSession() {
    setEndError(null);
    try {
      await api.post('/messages/end-session');
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            '👋 Thank you for sharing. Your session has ended and is saved in your history.',
        },
      ]);
      setChatEnded(true);
      if (onChatEnded) onChatEnded();
    } catch (err) {
      console.error('Failed to end session:', err);
      setEndError('⚠️ Could not end session. Please try again.');
    }
  }

  return (
    <div className="flex flex-col h-[500px] w-full max-w-2xl bg-white rounded-2xl shadow-xl border border-gray-300">
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-6 space-y-4"
      >
        {messages.map((m, i) => (
          <div
            key={i}
            className={`max-w-md p-4 rounded-xl break-words whitespace-pre-wrap ${
              m.role === 'user'
                ? 'ml-auto bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-800'
            }`}
          >
            {m.content}
            {m.role === 'user' && m.emotion && (
              <span
                className={`ml-2 px-2 py-1 text-xs rounded-full text-white ${badgeColor[m.emotion]}`}
              >
                {m.emotion}
              </span>
            )}
          </div>
        ))}
      </div>

      {chatEnded ? (
        <div className="p-4 text-center text-sm text-gray-500">
          👋 Chat ended. Your session is saved in your history.
        </div>
      ) : (
        <>
          <form onSubmit={sendMessage} className="p-4 flex gap-3 border-t bg-white">
            <input
              className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Type how you feel…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <button
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-5 py-2 rounded-lg disabled:opacity-50"
              disabled={loading}
            >
              {loading ? '...' : 'Send'}
            </button>
          </form>

          <EndChatButton onConfirm={endChatSession} />
          {endError && (
            <div className="text-sm text-red-500 text-center py-2">
              {endError}
            </div>
          )}
        </>
      )}
    </div>
  );
}
