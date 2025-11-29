import React, { useState, useEffect, useRef } from 'react';
import { FocusSession, FocusSettings } from '../types';
import { PlayIcon, PauseIcon, StopIcon, SettingsIcon, ClockIcon, AlertIcon } from './Icons';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface FocusModeProps {
  sessions: FocusSession[];
  setSessions: React.Dispatch<React.SetStateAction<FocusSession[]>>;
}

const FocusMode: React.FC<FocusModeProps> = ({ sessions, setSessions }) => {
  // Settings State
  const [settings, setSettings] = useState<FocusSettings>(() => {
    const saved = localStorage.getItem('roncate_focus_settings');
    return saved ? JSON.parse(saved) : {
      timerDuration: 25, // default 25 min
      mode: 'countdown',
      punishments: {
        audio: true,
        penaltyTime: true,
        blurScreen: true,
        popupWarning: true
      },
      autoPause: true
    };
  });

  // Timer State
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [timeLeft, setTimeLeft] = useState(settings.timerDuration * 60);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [distractions, setDistractions] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  
  // Punishment States
  const [isBlurred, setIsBlurred] = useState(false);
  const [showWarning, setShowWarning] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);

  // --- Effects ---

  // Save Settings
  useEffect(() => {
    localStorage.setItem('roncate_focus_settings', JSON.stringify(settings));
  }, [settings]);

  // Handle Distraction (Visibility Change)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!isActive || isPaused) return;

      if (document.hidden) {
        // User left the tab
        if (settings.autoPause) {
          setIsPaused(true);
        }
        handleDistraction();
      }
    };

    const handleWindowBlur = () => {
      if (!isActive || isPaused) return;
      // Triggers when user clicks outside window or minimizes
      if (settings.autoPause) {
          setIsPaused(true);
      }
      handleDistraction();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, [isActive, isPaused, settings]);

  // Timer Interval
  useEffect(() => {
    if (isActive && !isPaused) {
      timerRef.current = setInterval(() => {
        if (settings.mode === 'countdown') {
          setTimeLeft((prev) => {
            if (prev <= 1) {
              handleStop(true); // Complete
              return 0;
            }
            return prev - 1;
          });
        }
        setElapsedTime((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, isPaused, settings.mode]);

  // --- Logic ---

  const handleDistraction = () => {
    setDistractions(prev => prev + 1);
    
    // Punishment: Counter (Already handled by setDistractions)

    // Punishment: Audio
    if (settings.punishments.audio) {
      // Try playing the custom file first
      const audio = new Audio('/audio/motivation.mp3');
      audio.play().catch((err) => {
        console.warn("Custom audio not found or autoplay blocked, using TTS fallback.", err);
        // Fallback to TTS
        const utterance = new SpeechSynthesisUtterance("Padh le! Exam hai teri! Don't get distracted.");
        utterance.rate = 1.2;
        window.speechSynthesis.speak(utterance);
      });
    }

    // Punishment: Penalty Time (+1 minute)
    if (settings.punishments.penaltyTime && settings.mode === 'countdown') {
       setTimeLeft(prev => prev + 60);
    }

    // Punishment: Blur Screen
    if (settings.punishments.blurScreen) {
      setIsBlurred(true);
      setTimeout(() => setIsBlurred(false), 3000); // Remove blur after 3 seconds
    }

    // Punishment: Popup
    if (settings.punishments.popupWarning) {
      setShowWarning(true);
      setTimeout(() => setShowWarning(false), 3000);
    }
  };

  const handleStart = () => {
    if (!isActive) {
      // First start
      setTimeLeft(settings.timerDuration * 60);
      setElapsedTime(0);
      setDistractions(0);
      startTimeRef.current = Date.now();
    }
    setIsActive(true);
    setIsPaused(false);
  };

  const handlePause = () => {
    setIsPaused(true);
  };

  const handleStop = (completed: boolean = false) => {
    setIsActive(false);
    setIsPaused(false);
    if (timerRef.current) clearInterval(timerRef.current);

    if (elapsedTime > 60) { // Only save if session > 1 minute
      const session: FocusSession = {
        id: crypto.randomUUID(),
        startTime: startTimeRef.current || Date.now(),
        endTime: Date.now(),
        durationMinutes: Math.floor(elapsedTime / 60),
        distractionCount: distractions,
        focusScore: Math.max(0, 100 - (distractions * 5))
      };
      setSessions([session, ...sessions]);
    }

    if (!completed) {
      // Reset timer visual immediately if manually stopped
      setTimeLeft(settings.timerDuration * 60);
      setElapsedTime(0);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // --- Render ---

  return (
    <div className={`relative transition-all duration-300 ${isBlurred ? 'blur-md' : ''}`}>
       {/* Popup Warning */}
       {showWarning && (
          <div className="fixed top-10 left-1/2 transform -translate-x-1/2 bg-red-600 text-white px-6 py-3 rounded-full shadow-2xl z-50 animate-bounce flex items-center gap-2 font-bold">
             <AlertIcon className="w-6 h-6" />
             DON'T GET DISTRACTED!
          </div>
       )}

       <div className="grid lg:grid-cols-3 gap-6 h-[calc(100vh-100px)]">
          {/* Main Timer Area */}
          <div className="lg:col-span-2 flex flex-col gap-6">
             <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex-grow flex flex-col items-center justify-center relative p-10 transition-colors">
                <div className="absolute top-6 right-6 flex gap-2">
                   <div className="bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 px-3 py-1 rounded-full text-sm font-bold flex items-center gap-2">
                      <AlertIcon className="w-4 h-4" />
                      Distractions: {distractions}
                   </div>
                   <button 
                     onClick={() => setShowSettings(!showSettings)}
                     className="p-2 bg-slate-100 dark:bg-slate-700 rounded-full hover:bg-slate-200 dark:hover:bg-slate-600 transition text-slate-700 dark:text-slate-300"
                   >
                     <SettingsIcon className="w-5 h-5" />
                   </button>
                </div>

                <div className="text-center">
                   <h2 className="text-xl font-medium text-slate-500 dark:text-slate-400 mb-8 tracking-widest uppercase">
                     {settings.mode === 'countdown' ? 'Focus Timer' : 'Stopwatch'}
                   </h2>
                   <div className="text-9xl font-bold tabular-nums text-slate-800 dark:text-white mb-12 tracking-tight">
                     {settings.mode === 'countdown' ? formatTime(timeLeft) : formatTime(elapsedTime)}
                   </div>
                   
                   <div className="flex gap-6 justify-center">
                      {!isActive ? (
                        <button 
                          onClick={handleStart}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white p-6 rounded-full shadow-lg hover:shadow-xl transition transform hover:scale-105"
                        >
                          <PlayIcon className="w-10 h-10" />
                        </button>
                      ) : (
                        <>
                          {isPaused ? (
                            <button 
                              onClick={handleStart}
                              className="bg-green-500 hover:bg-green-600 text-white p-6 rounded-full shadow-lg transition"
                            >
                              <PlayIcon className="w-8 h-8" />
                            </button>
                          ) : (
                            <button 
                              onClick={handlePause}
                              className="bg-yellow-500 hover:bg-yellow-600 text-white p-6 rounded-full shadow-lg transition"
                            >
                              <PauseIcon className="w-8 h-8" />
                            </button>
                          )}
                          <button 
                            onClick={() => handleStop()}
                            className="bg-red-500 hover:bg-red-600 text-white p-6 rounded-full shadow-lg transition"
                          >
                            <StopIcon className="w-8 h-8" />
                          </button>
                        </>
                      )}
                   </div>
                   {isActive && settings.mode === 'countdown' && (
                     <p className="mt-8 text-slate-400 dark:text-slate-500">
                        Goal: {settings.timerDuration} minutes
                     </p>
                   )}
                </div>
             </div>

             {/* Settings Panel (Conditional) */}
             {showSettings && (
               <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 animate-fade-in transition-colors">
                  <h3 className="font-bold text-lg mb-4 text-slate-800 dark:text-white flex items-center gap-2">
                    <SettingsIcon className="w-5 h-5" /> Settings
                  </h3>
                  <div className="grid md:grid-cols-2 gap-6">
                     <div>
                        <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Duration (Minutes)</label>
                        <input 
                           type="number" 
                           value={settings.timerDuration}
                           onChange={(e) => setSettings({...settings, timerDuration: Number(e.target.value)})}
                           className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
                           disabled={isActive}
                        />
                     </div>
                     <div className="space-y-3">
                        <label className="block text-sm font-medium text-slate-600 dark:text-slate-300">Punishments</label>
                        <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-200">
                           <input 
                             type="checkbox" 
                             checked={settings.punishments.audio}
                             onChange={(e) => setSettings({...settings, punishments: {...settings.punishments, audio: e.target.checked}})}
                             className="rounded text-indigo-600"
                           />
                           Motivational Audio
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-200">
                           <input 
                             type="checkbox" 
                             checked={settings.punishments.penaltyTime}
                             onChange={(e) => setSettings({...settings, punishments: {...settings.punishments, penaltyTime: e.target.checked}})}
                             className="rounded text-indigo-600"
                           />
                           Timer Penalty (+1 min)
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-200">
                           <input 
                             type="checkbox" 
                             checked={settings.punishments.blurScreen}
                             onChange={(e) => setSettings({...settings, punishments: {...settings.punishments, blurScreen: e.target.checked}})}
                             className="rounded text-indigo-600"
                           />
                           Blur Screen
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-200">
                           <input 
                             type="checkbox" 
                             checked={settings.punishments.popupWarning}
                             onChange={(e) => setSettings({...settings, punishments: {...settings.punishments, popupWarning: e.target.checked}})}
                             className="rounded text-indigo-600"
                           />
                           Popup Warning
                        </label>
                     </div>
                  </div>
               </div>
             )}
          </div>

          {/* Analytics Sidebar */}
          <div className="flex flex-col gap-6">
             <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition-colors">
                <h3 className="font-bold text-lg mb-4 text-slate-800 dark:text-white flex items-center gap-2">
                   <ClockIcon className="w-5 h-5" /> Today's Stats
                </h3>
                <div className="space-y-4">
                   <div className="flex justify-between items-center p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                      <span className="text-slate-600 dark:text-slate-300">Total Study Time</span>
                      <span className="font-bold text-indigo-700 dark:text-indigo-300 text-xl">
                        {sessions.reduce((acc, s) => acc + s.durationMinutes, 0)} m
                      </span>
                   </div>
                   <div className="flex justify-between items-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                      <span className="text-slate-600 dark:text-slate-300">Total Distractions</span>
                      <span className="font-bold text-red-600 dark:text-red-400 text-xl">
                        {sessions.reduce((acc, s) => acc + s.distractionCount, 0)}
                      </span>
                   </div>
                   <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <span className="text-slate-600 dark:text-slate-300">Avg Focus Score</span>
                      <span className="font-bold text-green-600 dark:text-green-400 text-xl">
                        {sessions.length > 0 ? Math.round(sessions.reduce((acc, s) => acc + s.focusScore, 0) / sessions.length) : 0}
                      </span>
                   </div>
                </div>
             </div>

             <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex-grow transition-colors">
                <h3 className="font-bold text-lg mb-4 text-slate-800 dark:text-white">Recent Sessions</h3>
                <div className="h-40 mb-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={sessions.slice(0, 5).reverse()}>
                      <XAxis hide />
                      <YAxis hide />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1e293b', border: 'none', color: '#fff' }}
                        cursor={{fill: 'transparent'}}
                      />
                      <Bar dataKey="durationMinutes" fill="#6366f1" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-3 overflow-y-auto max-h-60 custom-scrollbar pr-2">
                   {sessions.length === 0 && <p className="text-slate-400 text-sm text-center">No sessions recorded yet.</p>}
                   {sessions.map(session => (
                      <div key={session.id} className="text-sm p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg flex justify-between items-center border border-transparent hover:border-slate-200 dark:hover:border-slate-600 transition">
                         <div>
                            <div className="font-medium text-slate-700 dark:text-slate-200">{new Date(session.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                            <div className="text-xs text-slate-400 dark:text-slate-500">{new Date(session.startTime).toLocaleDateString()}</div>
                         </div>
                         <div className="text-right">
                            <div className="font-bold text-indigo-600 dark:text-indigo-400">{session.durationMinutes} min</div>
                            <div className={`text-xs ${session.focusScore > 80 ? 'text-green-500' : 'text-orange-500'}`}>
                               Score: {session.focusScore}
                            </div>
                         </div>
                      </div>
                   ))}
                </div>
             </div>
          </div>
       </div>
    </div>
  );
};

export default FocusMode;