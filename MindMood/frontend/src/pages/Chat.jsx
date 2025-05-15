import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Disclaimer from '../components/Disclaimer';
import ChatBody from '../components/ChatBody';
import PastConversations from '../components/PastConversations';
import { useAuth } from '../hooks/useAuth';

export default function Chat() {
  const { token } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) navigate('/login');
  }, [token, navigate]);

  return (
    <>
      <Navbar />
      <Disclaimer />

      {/* centramos el widget */}
      <div className="flex flex-col items-center p-6 bg-gray-100 min-h-screen">
        <ChatBody />
        <div className="mt-8 w-full max-w-2xl">
          <PastConversations />
        </div>
      </div>
    </>
  );
}
