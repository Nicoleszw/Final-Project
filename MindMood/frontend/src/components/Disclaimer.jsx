import { useEffect, useState } from 'react';

export default function Disclaimer() {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShow(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  if (!show) return null;

  return (
    <div className="bg-red-50 text-red-700 text-sm text-center p-2 animate-fade-out">
      MindMood is not a substitute for professional therapy or emergency
      services. If you feel unsafe with your thoughts, please call your local
      emergency number or contact a mental-health professional immediately.
    </div>
  );
}
