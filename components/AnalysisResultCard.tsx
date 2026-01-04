import React, { useEffect, useState, useRef } from 'react';
import { AnalysisResult, Language } from '../types';
import { AlertTriangle, CheckCircle, ShieldAlert, RefreshCw, ChevronRight, Info, Volume2, Square, ExternalLink, ThumbsUp, Flag } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { generateScamAudio } from '../services/geminiService';
import { translations } from '../i18n';

interface AnalysisResultCardProps {
  result: AnalysisResult;
  onReset: () => void;
  language: Language;
}

export const AnalysisResultCard: React.FC<AnalysisResultCardProps> = ({ result, onReset, language }) => {
  const t = translations[language].analysisResult;
  const { is_scam, risk_score, advice, triggers, scam_type } = result;
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);

  // Calculate the confidence percentage for the display text
  // If it's safe (e.g. Risk Score 5), probability of safety is 95%
  // If it's scam (e.g. Risk Score 90), probability of fraud is 90%
  const displayProbability = is_scam ? risk_score : Math.max(0, 100 - risk_score);

  const getRiskColor = (score: number) => {
    if (score < 30) return '#10b981'; // Emerald 500
    if (score < 70) return '#f59e0b'; // Amber 500
    return '#ef4444'; // Red 500
  };

  const riskColor = getRiskColor(risk_score);
  
  const gaugeData = [
    { name: 'Score', value: risk_score },
    { name: 'Remaining', value: 100 - risk_score },
  ];

  const themeColor = is_scam ? 'red' : risk_score > 50 ? 'amber' : 'emerald';
  const ThemeIcon = is_scam ? ShieldAlert : risk_score > 50 ? AlertTriangle : CheckCircle;

  // Auto-play warning if risk is high (Voice Warning)
  useEffect(() => {
    if (is_scam && risk_score > 75) {
        // Delay slightly for effect
        const timer = setTimeout(() => {
            handlePlayAudio(true);
        }, 500);
        return () => clearTimeout(timer);
    }
  }, [is_scam, risk_score]);

  const stopAudio = () => {
    if (sourceRef.current) {
        sourceRef.current.stop();
        sourceRef.current = null;
    }
    setIsPlaying(false);
  };

  const handlePlayAudio = async (isWarning = false) => {
    if (isPlaying) {
        stopAudio();
        return;
    }

    setIsLoadingAudio(true);
    try {
        if (!audioCtxRef.current) {
            audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }

        // Construct text to speak
        let textToSpeak = advice;
        if (isWarning) {
             const warningPrefix = language === 'en' ? "Warning! High Risk Detected. " 
                : language === 'hi' ? "सावधान! उच्च जोखिम का पता चला है. "
                : "ସାବଧାନ! ଏହା ଏକ ବିପଦପୂର୍ଣ୍ଣ ସନ୍ଦେଶ | ";
             textToSpeak = warningPrefix + advice;
        }

        const buffer = await generateScamAudio(textToSpeak, language);
        
        const source = audioCtxRef.current.createBufferSource();
        source.buffer = buffer;
        source.connect(audioCtxRef.current.destination);
        source.onended = () => setIsPlaying(false);
        sourceRef.current = source;
        
        source.start();
        setIsPlaying(true);
    } catch (e) {
        console.error("Audio playback failed", e);
    } finally {
        setIsLoadingAudio(false);
    }
  };

  const handleReport = () => {
    window.open('https://cybercrime.gov.in', '_blank');
  };

  const statusText = is_scam ? t.scam : risk_score > 50 ? t.caution : t.lowRisk;
  const badgeText = is_scam ? t.critical : risk_score > 50 ? t.risk : t.safe;
  
  const summaryText = is_scam 
    ? t.summaryScam.replace('{prob}', displayProbability.toString())
    : t.summarySafe.replace('{prob}', displayProbability.toString());

  return (
    <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden animate-fade-in-up h-full flex flex-col">
      {/* Header */}
      <div className={`p-8 pb-6 border-b border-slate-100 relative overflow-hidden`}>
         <div className={`absolute top-0 left-0 w-full h-1 bg-${themeColor}-500`}></div>
         <div className="flex items-start justify-between">
            <div>
                 <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide bg-${themeColor}-50 text-${themeColor}-700 mb-3`}>
                    {badgeText}
                 </div>
                 <h3 className="text-2xl font-extrabold text-slate-900 leading-tight">
                    {statusText}
                 </h3>
            </div>
            <div className={`p-3 rounded-xl bg-${themeColor}-50 text-${themeColor}-600`}>
                <ThemeIcon size={32} />
            </div>
         </div>
      </div>

      <div className="p-8 pt-6 space-y-8 flex-grow">
        
        {/* Gauge & Score */}
        <div className="flex flex-col sm:flex-row items-center gap-8">
            <div className="relative h-40 w-40 flex-shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                    data={gaugeData}
                    cx="50%"
                    cy="100%"
                    startAngle={180}
                    endAngle={0}
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={0}
                    dataKey="value"
                    stroke="none"
                    >
                    <Cell fill={riskColor} />
                    <Cell fill="#f1f5f9" />
                    </Pie>
                </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-end pb-4 pointer-events-none">
                    <span className="text-3xl font-bold text-slate-800">{risk_score}</span>
                    <span className="text-xs text-slate-400 uppercase font-semibold">Risk Score</span>
                </div>
            </div>

            <div className="flex-1">
                <h4 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">{t.summary}</h4>
                <p className="text-slate-600 text-sm leading-relaxed mb-2">
                    {summaryText}
                </p>
                {scam_type && (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 rounded-md text-slate-600 text-xs font-medium">
                     <Info size={12} />
                     Type: {scam_type}
                  </div>
                )}
            </div>
        </div>

        <hr className="border-slate-100" />

        {/* Triggers Section */}
        {triggers && triggers.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                <ShieldAlert size={16} className="text-slate-400" />
                {t.redFlags}
            </h4>
            <div className="space-y-3">
              {triggers.map((trigger, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-red-50 border border-red-100 text-red-800 text-sm">
                   <div className="mt-0.5 min-w-[16px]"><ShieldAlert size={16} /></div>
                   <span>{trigger}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Advice Section with Audio */}
        <div className="bg-slate-50 rounded-xl p-6 border border-slate-200/60 relative">
          <div className="flex justify-between items-start mb-3">
             <h4 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">
                 {t.advice}
             </h4>
             <button 
                onClick={() => handlePlayAudio(false)}
                disabled={isLoadingAudio}
                className="p-2 -mt-2 -mr-2 text-blue-600 hover:bg-blue-100 rounded-full transition-colors disabled:opacity-50"
             >
                {isLoadingAudio ? (
                    <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                ) : isPlaying ? (
                    <Square size={20} fill="currentColor" />
                ) : (
                    <Volume2 size={20} />
                )}
             </button>
          </div>
          
          <div className="flex gap-4">
             <div className="w-1 bg-blue-500 rounded-full"></div>
             <p className="text-slate-700 leading-relaxed text-sm">
                {advice}
             </p>
          </div>
        </div>

        {/* Cyber Crime Reporting CTA */}
        {is_scam && (
          <div className="bg-slate-900 rounded-xl p-5 text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg shadow-slate-900/20">
              <div className="flex items-center gap-3">
                 <div className="p-2 bg-white/10 rounded-lg">
                    <ShieldAlert className="text-red-400" size={24} />
                 </div>
                 <div>
                    <h4 className="font-bold text-sm">{t.reportBtn}</h4>
                    <p className="text-xs text-slate-400">{t.reportDesc}</p>
                 </div>
              </div>
              <button 
                onClick={handleReport}
                className="w-full sm:w-auto px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white text-sm font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                 {t.reportBtn} <ExternalLink size={14} />
              </button>
          </div>
        )}
      </div>
      
      {/* Footer / Feedback / Disclaimer */}
      <div className="px-8 py-4 bg-slate-50/50 border-t border-slate-100 flex flex-col gap-3">
          <div className="flex justify-between items-center text-xs text-slate-400">
               <span className="font-semibold uppercase tracking-wider">{t.disclaimer}</span>
               <div className="flex gap-3">
                   <button className="flex items-center gap-1 hover:text-blue-600 transition-colors">
                       <ThumbsUp size={12} /> {t.feedbackHelpful}
                   </button>
                   <button className="flex items-center gap-1 hover:text-red-600 transition-colors">
                       <Flag size={12} /> {t.feedbackMistake}
                   </button>
               </div>
          </div>

        <button
          onClick={onReset}
          className="w-full py-3 flex items-center justify-center gap-2 text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-all font-medium shadow-sm hover:shadow mt-2"
        >
          <RefreshCw size={18} />
          {language === 'en' ? t.analyzeNew : t.scanAgain}
        </button>
      </div>
    </div>
  );
};