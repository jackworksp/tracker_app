import React, { useState } from 'react';
import { useSession } from '../context/SessionContext';
import { Play, Clock, Monitor, Smartphone, Youtube, Twitter, Facebook } from 'lucide-react';

const SessionCreate = () => {
  const { startSession } = useSession();
  const [platform, setPlatform] = useState('YouTube');
  const [duration, setDuration] = useState(15);
  const [goal, setGoal] = useState('');

  const handleStart = () => {
    if (!goal.trim()) {
      alert("Please enter a goal for your session.");
      return;
    }
    startSession(platform, duration, goal);
  };

  return (
    <div className="fade-in">
      <header className="mb-8 text-center">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
          Start Discovery
        </h2>
        <p className="text-gray-400 mt-2">Intentional content consumption.</p>
      </header>

      <div className="space-y-6 max-w-md mx-auto">
        {/* Platform Selection */}
        <section>
          <label className="block text-sm font-medium text-gray-300 mb-3">Select Platform</label>
          <div className="grid grid-cols-3 gap-3">
            {['YouTube', 'Reddit', 'Twitter'].map((p) => (
              <button
                key={p}
                onClick={() => setPlatform(p)}
                className={`p-4 rounded-xl border transition-all duration-200 flex flex-col items-center gap-2
                  ${platform === p 
                    ? 'bg-indigo-600/20 border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.3)]' 
                    : 'bg-gray-800/50 border-gray-700 hover:bg-gray-800'
                  }`}
              >
                {p === 'YouTube' && <Youtube size={24} className="text-red-500" />}
                {p === 'Reddit' && <div className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center text-white text-xs font-bold">R</div>}
                {p === 'Twitter' && <div className="w-6 h-6 rounded-full bg-blue-400 flex items-center justify-center text-white text-xs font-bold">T</div>}
                <span className="text-sm font-medium">{p}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Duration Selection */}
        <section>
          <label className="block text-sm font-medium text-gray-300 mb-3">Duration (Minutes)</label>
          <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700">
            <div className="flex justify-between mb-4">
              <span className="text-2xl font-bold text-indigo-400">{duration} min</span>
              <Clock className="text-gray-500" />
            </div>
            <input
              type="range"
              min="5"
              max="60"
              step="5"
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-indigo-500 hover:accent-indigo-400"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-2">
              <span>5m</span>
              <span>30m</span>
              <span>60m</span>
            </div>
          </div>
        </section>

        {/* Goal Input */}
        <section>
          <label className="block text-sm font-medium text-gray-300 mb-3">Session Goal</label>
          <textarea
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="What exactly are you looking for?"
            className="w-full bg-gray-800/50 border border-gray-700 rounded-xl p-4 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
            rows="3"
          />
        </section>

        {/* Start Button */}
        <button
          onClick={handleStart}
          className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-500/20 transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
        >
          <Play size={20} fill="currentColor" />
          Start Session
        </button>
      </div>
    </div>
  );
};

export default SessionCreate;
