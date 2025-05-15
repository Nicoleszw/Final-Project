import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function Navbar() {
  const { token, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <nav className="flex justify-between items-center px-6 py-4 bg-indigo-600 text-white shadow-md">
      <Link to="/" className="text-xl font-bold">MindMood</Link>

      {token && (
        <div className="flex gap-4 items-center">
          <Link to="/chat" className="hover:underline">Chat</Link>
          <Link to="/dashboard" className="hover:underline">Dashboard</Link>
          <Link to="/resources" className="hover:underline">Resources</Link>
          <button
            onClick={() => {
              logout();
              navigate('/login');
            }}
            className="bg-white text-indigo-600 px-4 py-1 rounded hover:bg-gray-100"
          >
            Log out
          </button>
        </div>
      )}
    </nav>
  );
}
