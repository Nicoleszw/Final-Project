import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import { useAuth } from '../hooks/useAuth';
import { api } from '../api';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Label,
} from 'recharts';

const happinessLevels = {
  joy: 100,
  surprise: 70,
  neutral: 50,
  sadness: 30,
  fear: 25,
  anger: 15,
};

export default function Dashboard() {
  const { token } = useAuth();
  const [data, setData] = useState([]);
  const [selectedDay, setSelectedDay] = useState(null);
  const [summary, setSummary] = useState('');

  useEffect(() => {
    if (!token) return;
    api.get('/stats?range=30d').then((res) => setData(res.data));
  }, [token]);

  const grouped = Object.values(
    data.reduce((acc, row) => {
      const day = row.day.slice(0, 10);
      acc[day] ??= { day, score: 0 };
      acc[day].score += happinessLevels[row.label] ?? 0;
      return acc;
    }, {})
  );

  const levelName = (value) => {
    if (value >= 90) return 'Very High';
    if (value >= 70) return 'High';
    if (value >= 50) return 'Medium';
    if (value >= 30) return 'Low';
    return 'Very Low';
  };

  const handleClick = async (e) => {
    const date = e?.activeLabel;
    if (!date) return;
    setSelectedDay(date);
    try {
      const res = await api.get(`/messages/summary/by-day/${date}`);
      setSummary(res.data.summary);
    } catch {
      setSummary('⚠️ No summary found for that day.');
    }
  };

  return (
    <>
      <Navbar />

      <div className="p-6 max-w-4xl mx-auto bg-white shadow-xl rounded-xl mt-6">
        <h1 className="text-2xl font-bold mb-4 text-center">
          Your Happiness Score (last 30 days)
        </h1>

        <ResponsiveContainer width="100%" height={320}>
          <LineChart
            data={grouped}
            onClick={handleClick}
            margin={{ top: 10, right: 30, left: 10, bottom: 60 }}
          >
            <defs>
              <linearGradient id="colorLine" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="orange" stopOpacity={0.8} />
                <stop offset="50%" stopColor="green" stopOpacity={0.8} />
                <stop offset="95%" stopColor="blue" stopOpacity={0.8} />
              </linearGradient>
            </defs>

            <XAxis dataKey="day" fontSize={12}>
              <Label
                value="Date"
                position="insideBottom"
                offset={-10}
                style={{ textAnchor: 'start', fontSize: 14, fill: '#333' }}
              />
            </XAxis>

            <YAxis
              domain={[40, 100]}
              tickFormatter={levelName}
              tick={{ fontSize: 12 }}
            >
              <Label
                value="Emotional State"
                angle={-90}
                position="insideLeft"
                style={{ textAnchor: 'middle', fontSize: 14, fill: '#333' }}
              />
            </YAxis>

            <Tooltip formatter={(v) => `${Math.round(v)} pts`} />

            <Line
              type="monotone"
              dataKey="score"
              stroke="url(#colorLine)"
              strokeWidth={3}
              dot={{ r: 5, stroke: 'black', strokeWidth: 1, fill: 'white' }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>

        {selectedDay && (
          <div className="mt-4 text-center text-gray-800">
            <strong>{selectedDay}</strong>: {summary}
          </div>
        )}
      </div>
    </>
  );
}
