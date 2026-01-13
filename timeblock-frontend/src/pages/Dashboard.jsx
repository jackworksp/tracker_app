import React from 'react';
import { useSession } from '../context/SessionContext';
import { StopCircle, ExternalLink, Battery } from 'lucide-react';

const Dashboard = () => {
  const { session, stopSession } = useSession();

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = ((session.duration * 60 - session.timeRemaining) / (session.duration * 60)) * 100;

  return (
    <div className="fade-in h-full flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md bg-gray-800/50 border border-gray-700 rounded-2xl p-8 relative overflow-hidden">
        {/* Background Pulse Animation */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gray-700">
          <div 
            className="h-full bg-gradient-to-r from-green-400 to-indigo-500 transition-all duration-1000 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="text-center space-y-6">
          <div className="inline-flex items-center justify-center p-3 bg-indigo-500/20 rounded-full text-indigo-400">
            <Battery size={32} />
          </div>

          <div>
            <h3 className="text-gray-400 text-sm uppercase tracking-wider font-semibold">Time Remaining</h3>
            <div className={`text-6xl font-black tabular-nums mt-2 tracking-tight ${session.timeRemaining < 60 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
              {formatTime(session.timeRemaining)}
            </div>
          </div>

          <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-800">
            <p className="text-gray-500 text-xs uppercase mb-1">Current Goal</p>
            <p className="text-lg font-medium text-gray-200">"{session.goal}"</p>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-8">
             <button
              onClick={() => {
                // In a real app, this would use a deep link
                window.open('https://youtube.com', '_blank');
              }}
              className="flex items-center justify-center gap-2 py-3 px-4 bg-gray-700 hover:bg-gray-600 rounded-xl text-white font-medium transition-colors"
            >
              <ExternalLink size={18} />
              Open App
            </button>
            
            <button
              onClick={stopSession}
              className="flex items-center justify-center gap-2 py-3 px-4 bg-red-500/20 hover:bg-red-500/30 text-red-500 border border-red-500/50 rounded-xl font-medium transition-colors"
            >
              <StopCircle size={18} />
              End Session
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
