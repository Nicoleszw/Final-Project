import { useParams, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';

const data = {
  'relaxation': {
    title: 'Relaxation',
    image: 'https://plus.unsplash.com/premium_vector-1682303329526-6b510101bfee?q=80&w=3224&auto=format&fit=crop&ixlib=rb-4.1.0',
    description:
      'Relaxation helps lessen the effects of stress. Relaxing your muscles as well as your mind helps enhance greater contentment and feelings of peace.',
    courses: [
      {
        title: 'Understanding Relaxation Techniques',
        content: `Relaxation is a deliberate practice to lower stress and tension in the body and mind. Activating your natural relaxation response can counteract chronic stress.

Techniques include breathing exercises, progressive muscle relaxation, guided imagery, and meditation. Practicing these daily can improve your emotional resilience.`,
      },
    ],
    exercise: {
      title: 'Progressive Muscle Relaxation',
      description: `1. Find a quiet space and sit or lie down comfortably.
2. Start at your feet and tense each muscle group for 5 seconds, then relax.
3. Move upward through your body.
4. Focus on your breathing.

Repeat daily for 10–15 minutes.`,
    },
  },

  'self-confidence': {
    title: 'Self-Confidence',
    image: 'https://plus.unsplash.com/premium_vector-1733882628868-7508bd417be7?q=80&w=3192&auto=format&fit=crop&ixlib=rb-4.1.0',
    description:
      'Building self-confidence empowers you to face challenges, accept criticism, and move forward with assurance and strength.',
    courses: [
      {
        title: 'Building Self-Confidence',
        content: `Self-confidence is belief in your ability to handle challenges. It grows with positive self-talk, reflection, and action.

Recognize your strengths, keep a success journal, and practice speaking to yourself kindly, especially after setbacks.`,
      },
    ],
    exercise: {
      title: 'Power Pose Technique',
      description: `1. Stand tall with hands on hips, chest up.
2. Breathe deeply for 2 minutes.
3. Visualize a past success or future achievement.

Do this before a presentation, interview, or challenge.`,
    },
  },

  'emotions': {
    title: 'Emotions',
    image: 'https://plus.unsplash.com/premium_vector-1730376548365-455bf6e1e01c?q=80&w=2978&auto=format&fit=crop&ixlib=rb-4.1.0',
    description:
      'Understanding your emotions is key to emotional intelligence and personal well-being.',
    courses: [
      {
        title: 'Recognizing and Naming Emotions',
        content: `Being able to identify and name your emotions helps you process them. It allows for more intentional and constructive responses.

Use an emotion wheel or journal to track how your feelings change and why.`,
      },
    ],
    exercise: {
      title: 'Emotion Journal',
      description: `1. At the end of each day, write 3 emotions you felt.
2. Note what triggered each.
3. Reflect on your response and how you might change it next time.`,
    },
  },

  'sleep': {
    title: 'Sleep',
    image: 'https://plus.unsplash.com/premium_vector-1683141348845-0c29c6072158?q=80&w=2960&auto=format&fit=crop&ixlib=rb-4.1.0',
    description:
      'Better sleep improves mood, focus, and overall mental health. Learn techniques to rest better.',
    courses: [
      {
        title: 'Why Sleep Matters',
        content: `Sleep is essential for memory, mood, and recovery. Poor sleep can worsen anxiety and emotional regulation.

Establishing a consistent routine and reducing screen use before bed can significantly improve sleep quality.`,
      },
    ],
    exercise: {
      title: 'Wind Down Routine',
      description: `1. Turn off electronics 1 hour before bed.
2. Read, stretch, or journal to relax.
3. Try sleeping at the same time each night.

This signals your brain it's time to rest.`,
    },
  },

  'body-care': {
    title: 'Taking Care of Your Body',
    image: 'https://plus.unsplash.com/premium_vector-1682304424952-c1f3171bb8e6?q=80&w=2968&auto=format&fit=crop&ixlib=rb-4.1.0',
    description:
      'Physical well-being supports mental health. Movement, nutrition, and hygiene are key.',
    courses: [
      {
        title: 'Body-Mind Connection',
        content: `What you eat and how you move affects how you feel. Physical self-care improves energy and outlook.

Focus on hydration, balanced meals, and moderate physical activity.`,
      },
    ],
    exercise: {
      title: 'Mindful Walk',
      description: `1. Go for a 15-minute walk outside.
2. Focus on your breath and surroundings.
3. Notice the colors, sounds, and sensations.

Let it clear your mind and restore calm.`,
    },
  },

  'relationships': {
    title: 'Relationships',
    image: 'https://plus.unsplash.com/premium_vector-1682270136767-8b28c73bc381?q=80&w=3018&auto=format&fit=crop&ixlib=rb-4.1.0',
    description:
      'Healthy relationships help with emotional support and mental clarity.',
    courses: [
      {
        title: 'Nurturing Connections',
        content: `Strong relationships are built on communication, empathy, and boundaries.

Quality time and honest conversations help maintain emotional closeness.`,
      },
    ],
    exercise: {
      title: 'Connection Call',
      description: `1. Call or message a friend/family member.
2. Ask how they’re doing and share something meaningful.
3. Practice listening without interrupting.`,
    },
  },

  'beat-stress': {
    title: 'Beat Stress',
    image: 'https://plus.unsplash.com/premium_vector-1682306020030-fa04953cc7c9?q=80&w=2824&auto=format&fit=crop&ixlib=rb-4.1.0',
    description:
      'Manage daily pressures with effective strategies for resilience.',
    courses: [
      {
        title: 'Understanding Stress Response',
        content: `Stress activates your fight-or-flight system. While helpful short-term, chronic stress can be harmful.

Coping tools like breathing, exercise, and time management can reduce its impact.`,
      },
    ],
    exercise: {
      title: 'Deep Breathing',
      description: `1. Inhale for 4 seconds.
2. Hold for 4 seconds.
3. Exhale for 6 seconds.
4. Repeat for 2–5 minutes.`,
    },
  },

  'manage-anger': {
    title: 'Manage Anger',
    image: 'https://plus.unsplash.com/premium_vector-1683134290513-05e342dc6d47?q=80&w=3056&auto=format&fit=crop&ixlib=rb-4.1.0',
    description:
      'Learn techniques to control anger and express it constructively.',
    courses: [
      {
        title: 'Anger as a Signal',
        content: `Anger often hides other emotions like hurt or fear. Expressing it constructively can prevent damage in relationships.

Pause before reacting. Notice what you’re feeling and why.`,
      },
    ],
    exercise: {
      title: 'Pause and Reflect',
      description: `1. When angry, pause and count to 10.
2. Ask: What’s really bothering me?
3. Choose a calm way to express your need.`,
    },
  },

  'positivity': {
    title: 'Positivity',
    image: 'https://plus.unsplash.com/premium_vector-1721918268089-754a2bb79b8f?q=80&w=3230&auto=format&fit=crop&ixlib=rb-4.1.0',
    description:
      'A positive mindset improves well-being and helps you face challenges with strength.',
    courses: [
      {
        title: 'The Power of Optimism',
        content: `Focusing on possibilities instead of problems helps you adapt and grow.

Optimism doesn’t ignore hardship—it finds meaning and motivation within it.`,
      },
    ],
    exercise: {
      title: 'Gratitude Practice',
      description: `1. Write down 3 things you’re grateful for today.
2. Include both big and small things.
3. Revisit the list when feeling low.`,
    },
  },
};

export default function ResourceDetail() {
  const { topic } = useParams();
  const resource = data[topic];

  if (!resource) {
    return (
      <div className="p-6 text-center">
        <Navbar />
        <p className="mt-10 text-gray-600">Resource not found.</p>
        <Link to="/resources" className="text-indigo-600 hover:underline">← Back to Resources</Link>
      </div>
    );
  }

  return (
    <div>
      <Navbar />

      <div className="max-w-3xl mx-auto p-6">
        <img
          src={resource.image}
          alt={resource.title}
          className="rounded-xl w-full h-48 object-cover mb-6"
        />

        <h1 className="text-3xl font-bold mb-2">{resource.title}</h1>
        <p className="text-gray-700 mb-6">{resource.description}</p>

        <h2 className="text-xl font-semibold mb-2">Course</h2>
        {resource.courses.map((c, idx) => (
          <div key={idx} className="bg-gray-100 p-4 rounded-lg mb-6">
            <h3 className="text-lg font-medium mb-1">{c.title}</h3>
            <p className="text-sm text-gray-700 whitespace-pre-line">{c.content}</p>
          </div>
        ))}

        <h2 className="text-xl font-semibold mb-2">Exercise</h2>
        <div className="bg-gray-100 p-4 rounded-lg">
          <h3 className="text-lg font-medium mb-1">{resource.exercise.title}</h3>
          <p className="text-sm text-gray-700 whitespace-pre-line mb-3">{resource.exercise.description}</p>
        </div>

        <div className="mt-6">
          <Link to="/resources" className="text-indigo-600 hover:underline">← Back to Resources</Link>
        </div>
      </div>
    </div>
  );
}