import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../api';

export default function Login() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      const firstLogin = localStorage.getItem('firstLogin');
      if (firstLogin) {
        localStorage.removeItem('firstLogin');
        navigate('/welcome');
      } else {
        navigate('/dashboard');
      }
    }
  }, [navigate]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data } = await api.post('/auth/login', { email, password });
      localStorage.setItem('token', data.token);

      // Redirige según si es nuevo usuario
      const firstLogin = localStorage.getItem('firstLogin');
      if (firstLogin) {
        localStorage.removeItem('firstLogin');
        navigate('/welcome');
      } else {
        navigate('/dashboard');
      }

    } catch (err) {
      const msg =
        err.response?.data ||
        'Invalid email or password. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md space-y-5 p-8 bg-white rounded-xl shadow-xl"
      >
        <h1 className="text-2xl font-bold text-center text-indigo-700">
          Sign in to MindMood
        </h1>

        <input
          type="email"
          placeholder="Email"
          className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {error && (
          <p className="text-sm text-red-600 text-center font-medium">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded transition disabled:opacity-50"
        >
          {loading ? 'Signing in…' : 'Sign in'}
        </button>

        <p className="text-sm text-center text-gray-700">
          Don’t have an account?{' '}
          <Link to="/signup" className="text-indigo-600 font-medium hover:underline">
            Create one
          </Link>
        </p>
      </form>
    </div>
  );
}
