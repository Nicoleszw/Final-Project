import { useState } from 'react';

export default function EndChatButton({ onConfirm }) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleConfirm() {
    setLoading(true);
    setError(null);
    try {
      await onConfirm();  // Ejecuta función recibida (desde ChatBody)
      setShowConfirm(false);
    } catch (err) {
      console.error('Failed to end chat:', err);
      setError('Error ending chat. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-end p-2 border-t bg-gray-50">
      {showConfirm ? (
        <div className="flex flex-col items-end gap-2 text-sm">
          <div className="flex gap-2 items-center">
            <span>Are you sure you want to end the chat?</span>
            <button
              onClick={handleConfirm}
              disabled={loading}
              className="px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
            >
              {loading ? 'Ending...' : 'Yes'}
            </button>
            <button
              onClick={() => setShowConfirm(false)}
              className="px-3 py-1 rounded border text-gray-600"
            >
              Cancel
            </button>
          </div>
          {error && <p className="text-red-500 text-xs">{error}</p>}
        </div>
      ) : (
        <button
          onClick={() => setShowConfirm(true)}
          className="text-sm text-gray-500 hover:underline"
        >
          End chat
        </button>
      )}
    </div>
  );
}
