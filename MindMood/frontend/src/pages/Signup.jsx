import { useState } from 'react';
import { api } from '../api';
import { useNavigate, Link } from 'react-router-dom';

export default function Signup() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data } = await api.post('/auth/signup', { email, password });

      localStorage.setItem('token', data.token);
      localStorage.setItem('firstLogin', 'true');

      navigate('/welcome');
    } catch (err) {
      const msg = err.response?.data || 'Registration failed. Try again.';
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
          Create your MindMood account
        </h1>

        <input
          type="email"
          className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="Password"
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
          {loading ? 'Creating account…' : 'Sign up'}
        </button>

        <p className="text-sm text-center text-gray-700">
          Already have an account?{' '}
          <Link to="/login" className="text-indigo-600 font-medium hover:underline">
            Log in
          </Link>
        </p>
      </form>
    </div>
  );
}
