'use client';

import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white mb-8">UNIT Card Game</h1>
        
        <div className="space-y-4">
          <Link 
            href="/solo"
            className="block w-64 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Mode Solo
          </Link>
          
          <button 
            className="block w-64 px-6 py-3 bg-gray-600 text-white rounded-lg opacity-50 cursor-not-allowed"
            disabled
          >
            Mode Online (Bientôt disponible)
          </button>
        </div>
      </div>
    </div>
  );
}
