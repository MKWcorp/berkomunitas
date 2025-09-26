'use client';

import { useEffect, useState } from 'react';

export default function ErrorBoundary({ error, reset }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <h2 className="text-2xl font-bold mb-4">Something went wrong!</h2>
      <button
        className="bg-gray-800 hover:bg-gray-900 text-white font-bold py-2 px-4 rounded"
        onClick={reset}
      >
        Try again
      </button>
    </div>
  );
}
