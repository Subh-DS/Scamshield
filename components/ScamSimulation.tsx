import React, { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle, XCircle, RefreshCw, Trophy, AlertTriangle, ShieldCheck, Heart, Zap, Sparkles, Loader2, Play } from 'lucide-react';
import { Language } from '../types';
import { translations } from '../i18n';
import { getScamDojoQuestions, DojoScenario } from '../services/geminiService';

interface ScamSimulationProps {
  onBack: () => void;
  language: Language;
}

export const ScamSimulation: React.FC<ScamSimulationProps> = ({ onBack, language }) => {
  const t = translations[language].simulation;
  
  // Game State
  const [gameState, setGameState] = useState<'intro' | 'loading' | 'playing' | 'result'>('intro');
  const [scenarios, setScenarios] = useState<DojoScenario[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [streak, setStreak] = useState(0);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);

  // Load questions from Gemini
  const startDojo = async () => {
    setGameState('loading');
    setLives(3);
    setScore(0);
    setStreak(0);
    setCurrentIndex(0);
    setFeedback(null);

    try {
        const newScenarios = await getScamDojoQuestions(language);
        setScenarios(newScenarios);
        setGameState('playing');
    } catch (e) {
        console.error("Failed to load dojo", e);
        // Fallback logic handled in service, but if empty
        setGameState('result'); // or error state
    }
  };

  const handleDecision = (userSaysScam: boolean) => {
    if (!scenarios[currentIndex]) return;
    
    const isActuallyScam = scenarios[currentIndex].isScam;
    const isCorrect = userSaysScam === isActuallyScam;

    if (isCorrect) {
        const bonus = streak > 1 ? 5 : 0;
        setScore(prev => prev + 10 + bonus);
        setStreak(prev => prev + 1);
        setFeedback('correct');
    } else {
        setLives(prev => prev - 1);
        setStreak(0);
        setFeedback('wrong');
    }

    // Delay for feedback
    setTimeout(() => {
        if (lives <= 1 && !isCorrect) {
            setGameState('result'); // Game Over
        } else if (currentIndex < scenarios.length - 1) {
            setFeedback(null);
            setCurrentIndex(prev => prev + 1);
        } else {
            setGameState('result'); // Win/Complete
        }
    }, 2200);
  };

  const currentScenario = scenarios[currentIndex];

  // Render Intro Screen
  if (gameState === 'intro') {
      return (
          <div className="w-full max-w-lg mx-auto px-4 py-8 animate-fade-in flex flex-col items-center justify-center min-h-[60vh] text-center">
              <div className="w-24 h-24 bg-slate-900 rounded-3xl flex items-center justify-center mb-6 shadow-2xl shadow-blue-900/20 transform rotate-3">
                  <Zap size={48} className="text-yellow-400 fill-yellow-400 animate-pulse" />
              </div>
              <h1 className="text-4xl font-black text-slate-900 mb-2 tracking-tight">{t.title}</h1>
              <p className="text-slate-500 mb-8 max-w-xs leading-relaxed">{t.subtitle}</p>
              
              <div className="bg-white p-6 rounded-2xl border-2 border-slate-100 w-full mb-8 shadow-sm">
                  <div className="flex justify-between text-sm font-bold text-slate-600 mb-2">
                      <span>{t.lives}: 3 ❤️</span>
                      <span>{t.gen}: AI ✨</span>
                  </div>
                  <div className="h-1 bg-slate-100 rounded-full w-full">
                      <div className="h-full bg-blue-500 w-2/3 rounded-full opacity-50"></div>
                  </div>
              </div>

              <button 
                onClick={startDojo}
                className="w-full py-4 bg-slate-900 text-white text-lg font-bold rounded-xl shadow-lg shadow-slate-900/30 hover:shadow-xl hover:-translate-y-1 transition-all flex items-center justify-center gap-2 group"
              >
                  <Play size={24} className="group-hover:translate-x-1 transition-transform" />
                  {t.startBtn}
              </button>
              
              <button onClick={onBack} className="mt-6 text-slate-400 font-bold text-sm hover:text-slate-600">
                  {t.back}
              </button>
          </div>
      )
  }

  // Render Loading
  if (gameState === 'loading') {
      return (
          <div className="w-full max-w-lg mx-auto px-4 py-12 flex flex-col items-center justify-center min-h-[50vh] text-center">
              <Loader2 size={48} className="text-blue-600 animate-spin mb-4" />
              <h2 className="text-xl font-bold text-slate-900">{t.generating}</h2>
              <p className="text-slate-500 text-sm mt-2">{t.genDesc}</p>
          </div>
      )
  }

  // Render Result
  if (gameState === 'result') {
      const isWin = lives > 0;
      return (
        <div className="w-full max-w-lg mx-auto px-4 py-8 animate-pop-in text-center">
             <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl ${isWin ? 'bg-yellow-100 text-yellow-600' : 'bg-red-100 text-red-600'}`}>
                {isWin ? <Trophy size={48} /> : <XCircle size={48} />}
            </div>
            
            <h2 className="text-3xl font-black text-slate-900 mb-2">
                {isWin ? t.winTitle : t.loseTitle}
            </h2>
            <div className="text-5xl font-black text-blue-600 mb-2 tracking-tighter">
                {score}
            </div>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs mb-8">{t.finalScore}</p>
            
            <button 
                onClick={startDojo}
                className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors mb-4"
            >
                <RefreshCw size={20} /> {t.playAgain}
            </button>
             <button onClick={onBack} className="text-slate-400 font-bold text-sm hover:text-slate-600">
                  {t.back}
              </button>
        </div>
      )
  }

  // Render Game Board
  return (
    <div className="w-full max-w-md mx-auto px-4 py-6 flex flex-col h-[calc(100vh-90px)] min-h-[550px]">
      {/* HUD */}
      <div className="flex justify-between items-center mb-4 flex-shrink-0">
        <button onClick={onBack} className="p-2 -ml-2 text-slate-400 hover:text-slate-900 transition-colors">
            <ArrowLeft size={24} />
        </button>
        
        <div className="flex gap-1">
            {[...Array(3)].map((_, i) => (
                <Heart 
                    key={i} 
                    size={24} 
                    className={`transition-all ${i < lives ? 'fill-red-500 text-red-500' : 'fill-slate-200 text-slate-200'}`} 
                />
            ))}
        </div>
        
        <div className="bg-slate-900 text-white px-3 py-1 rounded-full text-sm font-bold font-mono">
            {score.toString().padStart(4, '0')}
        </div>
      </div>

      {/* Game Card Container - min-h-0 allows child scroll */}
      <div className="relative flex-1 perspective-container min-h-0">
           
           {/* Feedback Overlay - Floating above */}
           {feedback && (
               <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none">
                   <div className={`transform scale-150 transition-all duration-300 ${feedback === 'correct' ? 'text-green-500 rotate-12' : 'text-red-500 -rotate-12'}`}>
                        {feedback === 'correct' ? (
                            <div className="bg-white rounded-full p-4 shadow-2xl border-4 border-green-500">
                                <CheckCircle size={80} className="fill-green-100" />
                            </div>
                        ) : (
                            <div className="bg-white rounded-full p-4 shadow-2xl border-4 border-red-500">
                                <XCircle size={80} className="fill-red-100" />
                            </div>
                        )}
                   </div>
               </div>
           )}

           {/* The Message Card */}
           <div className={`w-full h-full bg-white rounded-3xl shadow-2xl border-4 border-slate-100 overflow-hidden flex flex-col relative transition-all duration-500 ${feedback === 'wrong' ? 'animate-shake-gentle border-red-200' : feedback === 'correct' ? 'border-green-200 scale-105' : ''}`}>
                
                {/* Header */}
                <div className="bg-slate-50 p-4 border-b border-slate-100 flex items-center gap-3 flex-shrink-0">
                    <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center text-slate-500 font-bold text-lg">
                        {currentScenario.sender.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="font-bold text-slate-900 truncate">{currentScenario.sender}</div>
                        <div className="text-xs text-slate-400">Now</div>
                    </div>
                    {currentScenario.difficulty === 'Hard' && (
                        <div className="bg-orange-100 text-orange-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                            Hard
                        </div>
                    )}
                </div>

                {/* Body - Added overflow-y-auto */}
                <div className="flex-1 p-6 flex flex-col justify-center items-center bg-white relative overflow-y-auto custom-scrollbar">
                    <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none"></div>
                    <p className="text-lg sm:text-xl font-medium text-slate-800 text-center leading-relaxed relative z-10 break-words w-full">
                        "{currentScenario.text}"
                    </p>
                </div>

                {/* Feedback Text (Shown after decision) */}
                {feedback && (
                    <div className={`p-4 text-center font-bold text-sm animate-fade-in flex-shrink-0 ${feedback === 'correct' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                        {currentScenario.reason}
                    </div>
                )}
           </div>
      </div>

      {/* Controls */}
      <div className="mt-6 grid grid-cols-2 gap-4 flex-shrink-0">
            <button 
                onClick={() => handleDecision(false)}
                disabled={feedback !== null}
                className="py-4 rounded-2xl bg-white border-2 border-slate-100 shadow-[0_4px_0_rgb(226,232,240)] active:shadow-none active:translate-y-[4px] transition-all text-slate-600 font-bold text-lg flex flex-col items-center gap-2 hover:border-green-200 hover:text-green-600 disabled:opacity-50"
            >
                <ShieldCheck size={28} />
                {t.safe}
            </button>

            <button 
                onClick={() => handleDecision(true)}
                disabled={feedback !== null}
                className="py-4 rounded-2xl bg-white border-2 border-slate-100 shadow-[0_4px_0_rgb(226,232,240)] active:shadow-none active:translate-y-[4px] transition-all text-slate-600 font-bold text-lg flex flex-col items-center gap-2 hover:border-red-200 hover:text-red-600 disabled:opacity-50"
            >
                <AlertTriangle size={28} />
                {t.scam}
            </button>
      </div>

    </div>
  );
};