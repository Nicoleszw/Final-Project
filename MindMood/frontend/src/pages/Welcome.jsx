import Navbar from '../components/Navbar';
import { useState } from 'react';
import ChatBody from '../components/ChatBody';

export default function Home() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Navbar />

      <section className="max-w-3xl mx-auto p-8 space-y-6">
      <h1 className="text-4xl font-bold text-indigo-700 text-center">
        Welcome to MindMood
      </h1>


        <p>
          <strong>MindMood is your private, judgement-free space to talk about
          how you feel.</strong> Our AI-powered therapist listens with empathy,
          asks gentle questions, and offers practical techniques grounded in
          cognitive-behavioural therapy, mindfulness, and positive psychology.
        </p>

        <p>
          Whether you're feeling anxious, overwhelmed, or simply need to vent,
          you can share your thoughts here at any time. Every message is
          analysed confidentially so we can track your emotional patterns and
          show your progress on the Dashboard.
        </p>

        <p>
          <em>
            This is a safe and fully confidential environment. You deserve to
            feel better, and MindMood will give you the insights and tools to
            get there — one conversation at a time.
          </em>
        </p>

        {/* Toggle button */}
        <button
          onClick={() => setOpen(!open)}
          className="bg-indigo-600 text-white px-4 py-2 rounded"
        >
          {open ? 'Hide chat' : 'Open chat'}
        </button>

        {/* Collapsible chat widget */}
        <div className={open ? 'block' : 'hidden'}>
          <ChatBody hidden={!open} />
        </div>
      </section>
    </>
  );
}
