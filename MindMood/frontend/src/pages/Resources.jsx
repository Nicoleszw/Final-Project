import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';

const resources = [
  {
    id: 'relaxation',
    title: 'Relaxation',
    description:
      'Relaxation helps lessen the effects of stress. Relaxing your muscles as well as your mind enhances feelings of contentment and peace.',
    image: 'https://plus.unsplash.com/premium_vector-1682303329526-6b510101bfee?q=80&w=3224&auto=format&fit=crop&ixlib=rb-4.1.0',
  },
  {
    id: 'self-confidence',
    title: 'Self-Confidence',
    description:
      'Building self-confidence empowers you to face challenges, accept criticism, and move forward with assurance and strength.',
    image: 'https://plus.unsplash.com/premium_vector-1733882628868-7508bd417be7?q=80&w=3192&auto=format&fit=crop&ixlib=rb-4.1.0',
  },
  {
    id: 'emotions',
    title: 'Emotions',
    description:
      'Understanding your emotions is key to emotional intelligence and personal well-being.',
    image: 'https://plus.unsplash.com/premium_vector-1730376548365-455bf6e1e01c?q=80&w=2978&auto=format&fit=crop&ixlib=rb-4.1.0',
  },
  {
    id: 'sleep',
    title: 'Sleep',
    description:
      'Better sleep improves mood, focus, and overall mental health. Learn techniques to rest better.',
    image: 'https://plus.unsplash.com/premium_vector-1683141348845-0c29c6072158?q=80&w=2960&auto=format&fit=crop&ixlib=rb-4.1.0',
  },
  {
    id: 'body-care',
    title: 'Taking Care of Your Body',
    description:
      'Physical well-being supports mental health. Movement, nutrition, and hygiene are key.',
    image: 'https://plus.unsplash.com/premium_vector-1682304424952-c1f3171bb8e6?q=80&w=2968&auto=format&fit=crop&ixlib=rb-4.1.0',
  },
  {
    id: 'relationships',
    title: 'Relationships',
    description:
      'Healthy relationships help with emotional support and mental clarity.',
    image: 'https://plus.unsplash.com/premium_vector-1682270136767-8b28c73bc381?q=80&w=3018&auto=format&fit=crop&ixlib=rb-4.1.0',
  },
  {
    id: 'beat-stress',
    title: 'Beat Stress',
    description:
      'Manage daily pressures with effective strategies for resilience.',
    image: 'https://plus.unsplash.com/premium_vector-1682306020030-fa04953cc7c9?q=80&w=2824&auto=format&fit=crop&ixlib=rb-4.1.0',
  },
  {
    id: 'manage-anger',
    title: 'Manage Anger',
    description:
      'Learn techniques to control anger and express it constructively.',
    image: 'https://plus.unsplash.com/premium_vector-1683134290513-05e342dc6d47?q=80&w=3056&auto=format&fit=crop&ixlib=rb-4.1.0',
  },
  {
    id: 'positivity',
    title: 'Positivity',
    description:
      'A positive mindset improves well-being and helps you face challenges with strength.',
    image: 'https://plus.unsplash.com/premium_vector-1721918268089-754a2bb79b8f?q=80&w=3230&auto=format&fit=crop&ixlib=rb-4.1.0',
  },
];

export default function Resources() {
  const navigate = useNavigate();

  return (
    <div>
      <Navbar />
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4 text-center">Discover Resources</h1>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {resources.map((r) => (
            <div
              key={r.id}
              className="bg-white rounded-xl shadow-lg overflow-hidden cursor-pointer hover:shadow-xl transition"
              onClick={() => navigate(`/resources/${r.id}`)}
            >
              <div
                className="h-40 bg-cover bg-center"
                style={{ backgroundImage: `url(${r.image})` }}
              ></div>
              <div className="p-4">
                <h2 className="text-lg font-semibold mb-2">{r.title}</h2>
                <div className="flex gap-3 text-sm text-gray-600">
                  <span className="px-2 py-1 border rounded">1 course</span>
                  <span className="px-2 py-1 border rounded">1 exercise</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}