import React, { useState, useEffect } from 'react';
import { MapPin, Radio, ShieldAlert, Send, Activity, Siren, UserPlus, CheckCircle2, ExternalLink } from 'lucide-react';
import { getRegionalScamAlerts } from '../services/geminiService';
import { RegionalAlert, ScamReport, Language } from '../types';
import { translations } from '../i18n';

interface ScamRadarProps {
  onBack: () => void;
  language: Language;
}

export const ScamRadar: React.FC<ScamRadarProps> = ({ onBack, language }) => {
  const t = translations[language].radar;
  const [locationState, setLocationState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [alertData, setAlertData] = useState<RegionalAlert | null>(null);
  
  // Simulated Live Feed
  const [liveReports, setLiveReports] = useState<ScamReport[]>([
    { id: '1', type: 'UPI Fraud', description: 'Asked for PIN to receive refund', timestamp: Date.now() - 120000, reporter: 'Ravi K.' },
    { id: '2', type: 'Job Scam', description: 'Telegram task scam, lost 5k', timestamp: Date.now() - 340000, reporter: 'Anjali M.' },
    { id: '3', type: 'Fake Courier', description: 'FedEx asking for customs duty', timestamp: Date.now() - 600000, reporter: 'Anonymous' },
  ]);

  // Reporting Form State
  const [reportType, setReportType] = useState('');
  const [reportDesc, setReportDesc] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);

  const detectLocation = () => {
    setLocationState('loading');
    if (!navigator.geolocation) {
      setLocationState('error');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const data = await getRegionalScamAlerts(position.coords.latitude, position.coords.longitude);
          setAlertData(data);
          setLocationState('success');
        } catch (e) {
          setLocationState('error');
        }
      },
      () => {
        setLocationState('error');
      }
    );
  };

  const handleReportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate AI learning
    setTimeout(() => {
        const newReport: ScamReport = {
            id: Date.now().toString(),
            type: reportType || "Suspicious Activity",
            description: reportDesc,
            timestamp: Date.now(),
            reporter: "You"
        };
        
        setLiveReports(prev => [newReport, ...prev]);
        setReportType('');
        setReportDesc('');
        setIsSubmitting(false);
        setShowThankYou(true);
        
        // Hide thank you after 3s
        setTimeout(() => setShowThankYou(false), 3000);
    }, 1500);
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">
      <div className="flex items-center gap-3 mb-8">
        <button onClick={onBack} className="text-slate-400 hover:text-slate-600 font-bold text-sm">
            &larr; {t.back}
        </button>
        <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
            <Radio className="text-red-500 animate-pulse" />
            {t.title}
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: REGIONAL INTEL */}
        <div className="lg:col-span-7 space-y-6">
            
            {/* Location Activator */}
            <div className="bg-white rounded-2xl border-4 border-slate-900 shadow-[6px_6px_0px_0px_rgba(15,23,42,1)] p-6 relative overflow-hidden">
                {locationState === 'idle' && (
                    <div className="text-center py-6">
                        <MapPin size={48} className="mx-auto text-blue-500 mb-4 animate-bounce" />
                        <h3 className="text-xl font-bold text-slate-900 mb-2">{t.activateBtn}</h3>
                        <p className="text-slate-600 mb-6 max-w-sm mx-auto">
                            {t.activateDesc}
                        </p>
                        <button 
                            onClick={detectLocation}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-xl shadow-lg transition-transform active:scale-95"
                        >
                            {t.activateBtn}
                        </button>
                    </div>
                )}

                {locationState === 'loading' && (
                    <div className="flex flex-col items-center justify-center py-10">
                        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
                        <p className="font-bold text-slate-500 animate-pulse">{t.detecting}</p>
                    </div>
                )}

                {locationState === 'error' && (
                    <div className="text-center py-6">
                         <ShieldAlert size={48} className="mx-auto text-red-400 mb-4" />
                         <p className="text-red-600 font-bold">{t.error}</p>
                         <button onClick={detectLocation} className="text-blue-600 underline mt-2">{t.retry}</button>
                    </div>
                )}

                {locationState === 'success' && alertData && (
                    <div className="animate-fade-in-up">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{t.liveIntel}</div>
                                <h3 className="text-3xl font-black text-slate-900 leading-none mb-2">{alertData.location}</h3>
                                <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold uppercase rounded-full">
                                    <Activity size={10} /> {t.grounded}
                                </div>
                            </div>
                            <div className={`px-4 py-2 rounded-lg border-2 border-slate-900 font-bold uppercase ${
                                alertData.riskLevel === 'Critical' ? 'bg-red-500 text-white' : 'bg-yellow-400 text-slate-900'
                            }`}>
                                {alertData.riskLevel} {t.riskLabel || 'Risk'}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-6">
                            {alertData.topScams.map((scam, idx) => (
                                <div key={idx} className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                                    <div className="text-xs text-slate-500 font-bold uppercase mb-1">{t.trend} #{idx+1}</div>
                                    <div className="font-bold text-slate-900 text-lg leading-tight mb-1">{scam.title}</div>
                                    <div className="text-xs font-mono text-red-500">{t.activeReports}</div>
                                </div>
                            ))}
                        </div>

                        <div className="bg-red-50 border border-red-100 rounded-xl p-4 mb-4">
                            <h4 className="flex items-center gap-2 font-bold text-red-800 mb-2">
                                <Siren size={18} /> {t.recentIncidents}
                            </h4>
                            <ul className="space-y-2">
                                {alertData.recentIncidents.map((inc, i) => (
                                    <li key={i} className="text-sm text-red-700/80 pl-3 border-l-2 border-red-200">{inc}</li>
                                ))}
                            </ul>
                        </div>
                        
                        {/* Source Links */}
                        {alertData.sources && alertData.sources.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-slate-200">
                                <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">{t.verifiedSources}</p>
                                <div className="flex flex-wrap gap-2">
                                    {alertData.sources.slice(0, 3).map((source, i) => (
                                        <a 
                                            key={i} 
                                            href={source.uri} 
                                            target="_blank" 
                                            rel="noopener noreferrer" 
                                            className="flex items-center gap-1 text-[10px] bg-slate-50 hover:bg-white border border-slate-200 px-2 py-1.5 rounded-md text-blue-600 hover:text-blue-700 hover:border-blue-300 transition-colors max-w-[200px]"
                                        >
                                            <ExternalLink size={10} />
                                            <span className="truncate">{source.title}</span>
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}
                        
                        <div className="mt-4 text-[10px] text-slate-400 text-center font-mono">
                            Data powered by Google Search
                        </div>
                    </div>
                )}
            </div>

            {/* LIVE FEED */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <Activity size={20} className="text-green-500" />
                    {t.communityReports}
                </h3>
                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                    {liveReports.map((report) => (
                        <div key={report.id} className="flex gap-4 p-3 hover:bg-slate-50 rounded-lg transition-colors border-b border-slate-50 last:border-0">
                            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0 text-indigo-600 font-bold">
                                {report.reporter.charAt(0)}
                            </div>
                            <div>
                                <div className="flex items-center gap-2 mb-0.5">
                                    <span className="font-bold text-slate-900 text-sm">{report.type}</span>
                                    <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full">
                                        {Math.floor((Date.now() - report.timestamp) / 60000)}m ago
                                    </span>
                                </div>
                                <p className="text-sm text-slate-600 leading-snug">{report.description}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>

        {/* RIGHT COLUMN: REPORT FORM */}
        <div className="lg:col-span-5">
            <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500 rounded-full mix-blend-overlay filter blur-3xl opacity-20"></div>
                
                <h3 className="text-2xl font-bold mb-2 flex items-center gap-2">
                    <UserPlus className="text-blue-400" />
                    {t.reportScam}
                </h3>
                <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                    {t.helpAi}
                </p>

                {showThankYou ? (
                    <div className="h-64 flex flex-col items-center justify-center text-center animate-fade-in">
                        <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mb-4 shadow-lg shadow-green-500/50">
                            <CheckCircle2 size={32} className="text-white" />
                        </div>
                        <h4 className="text-xl font-bold text-white mb-2">{t.successTitle}</h4>
                        <p className="text-slate-400 text-sm">{t.successMsg}</p>
                    </div>
                ) : (
                    <form onSubmit={handleReportSubmit} className="space-y-4 relative z-10">
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">{t.scamTypeLabel}</label>
                            <input 
                                type="text"
                                required
                                value={reportType}
                                onChange={(e) => setReportType(e.target.value)}
                                placeholder={t.scamTypePlaceholder}
                                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder-slate-600"
                            />
                        </div>
                        
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">{t.descLabel}</label>
                            <textarea 
                                required
                                value={reportDesc}
                                onChange={(e) => setReportDesc(e.target.value)}
                                placeholder={t.descPlaceholder}
                                className="w-full h-32 bg-slate-800 border border-slate-700 rounded-xl p-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder-slate-600 resize-none"
                            />
                        </div>

                        <button 
                            type="submit"
                            disabled={isSubmitting}
                            className={`w-full py-4 rounded-xl font-bold text-slate-900 flex items-center justify-center gap-2 transition-all ${
                                isSubmitting ? 'bg-slate-600 cursor-not-allowed' : 'bg-blue-400 hover:bg-blue-300 hover:shadow-[0_0_20px_rgba(96,165,250,0.5)] active:scale-[0.98]'
                            }`}
                        >
                            {isSubmitting ? (
                                <Activity className="animate-spin" />
                            ) : (
                                <>
                                    {t.submitBtn} <Send size={18} />
                                </>
                            )}
                        </button>
                    </form>
                )}
            </div>

            <div className="mt-6 p-4 rounded-xl border border-slate-200 bg-white/50 text-center">
                 <div className="text-3xl font-black text-slate-900 mb-1">14,203</div>
                 <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">{t.preventedToday}</div>
            </div>
        </div>

      </div>
    </div>
  );
};