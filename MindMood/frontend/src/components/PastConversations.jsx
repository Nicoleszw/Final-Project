import { useEffect, useState } from 'react';
import { api } from '../api';

export default function PastConversations() {
  const [sessions, setSessions] = useState([]);
  const [openSummary, setOpenSummary] = useState(null);
  const [summaries, setSummaries] = useState({});

  useEffect(() => {
    async function fetchSessions() {
      try {
        const { data } = await api.get('/messages/sessions');
        setSessions(data);
      } catch (err) {
        console.error('Failed to load sessions:', err);
      }
    }
    fetchSessions();
  }, []);

  async function toggleSummary(sessionId) {
    if (openSummary === sessionId) {
      setOpenSummary(null);
      return;
    }

    if (!summaries[sessionId]) {
      try {
        // ⬇️ Usa la nueva ruta que genera el resumen dinámicamente
        const { data } = await api.get(`/messages/session/${sessionId}/summary`);
        setSummaries((prev) => ({ ...prev, [sessionId]: data.summary }));
      } catch (err) {
        console.error('Error fetching summary:', err);
        setSummaries((prev) => ({ ...prev, [sessionId]: '⚠️ Error loading summary' }));
      }
    }

    setOpenSummary(sessionId);
  }

  return (
    <div className="mt-8">
      <h2 className="text-lg font-semibold mb-2">Past Conversations</h2>
      <div className="space-y-2">
        {sessions.map((s) => (
          <div key={s.session_id}>
            <button
              onClick={() => toggleSummary(s.session_id)}
              className="w-full text-left p-3 border rounded-lg bg-gray-50 hover:bg-gray-100"
            >
              Conversation from {new Date(s.date).toLocaleString()}
            </button>
            {openSummary === s.session_id && summaries[s.session_id] && (
              <div className="mt-1 text-sm text-gray-600 px-3">
                {summaries[s.session_id]}
              </div>
            )}
          </div>
        ))}
        {sessions.length === 0 && (
          <p className="text-sm text-gray-500">No past conversations yet.</p>
        )}
      </div>
    </div>
  );
}
