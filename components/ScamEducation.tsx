import React, { useState } from 'react';
import { ArrowLeft, Zap, Link2, Smartphone, ShieldAlert, Check } from 'lucide-react';
import { Language } from '../types';
import { translations } from '../i18n';

interface ScamEducationProps {
  onBack: () => void;
  language: Language;
}

export const ScamEducation: React.FC<ScamEducationProps> = ({ onBack, language }) => {
  const t = translations[language].education;
  const [revealedPatterns, setRevealedPatterns] = useState<string[]>([]);

  // We toggle the patterns on click
  const togglePattern = (id: string) => {
    if (revealedPatterns.includes(id)) {
      setRevealedPatterns(prev => prev.filter(p => p !== id));
    } else {
      setRevealedPatterns(prev => [...prev, id]);
    }
  };

  const isRevealed = (id: string) => revealedPatterns.includes(id);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-fade-in">
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={onBack}
          className="p-2 rounded-full hover:bg-slate-100 transition-colors"
        >
          <ArrowLeft size={24} className="text-slate-600" />
        </button>
        <div>
          <h2 className="text-3xl font-black text-slate-900">{t.title}</h2>
          <p className="text-slate-500">{t.subtitle}</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-12 items-center justify-center">
         
         {/* THE ANATOMY VIEWER (Phone Screen) */}
         <div className="relative w-full max-w-sm bg-slate-900 rounded-[3rem] p-4 shadow-2xl border-4 border-slate-800">
             <div className="bg-white rounded-[2rem] overflow-hidden min-h-[500px] relative">
                 {/* Fake Status Bar */}
                 <div className="h-8 bg-slate-100 w-full flex justify-between px-6 items-center">
                     <div className="text-[10px] font-bold text-slate-900">9:41</div>
                     <div className="flex gap-1">
                         <div className="w-3 h-3 bg-slate-900 rounded-full opacity-20"></div>
                         <div className="w-3 h-3 bg-slate-900 rounded-full opacity-20"></div>
                     </div>
                 </div>

                 {/* Message UI */}
                 <div className="p-6 pt-10">
                     <div className="mb-6 flex flex-col items-center">
                         <div className={`w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold mb-2 transition-colors ${isRevealed('number') ? 'bg-red-100 text-red-600' : 'bg-slate-200 text-slate-500'}`}>
                             {isRevealed('number') ? <ShieldAlert /> : "U"}
                         </div>
                         <div 
                            onClick={() => togglePattern('number')}
                            className={`px-3 py-1 rounded-full text-sm font-mono cursor-pointer transition-all border-2 ${isRevealed('number') ? 'border-red-500 bg-red-50 text-red-700' : 'border-transparent text-slate-900'}`}
                        >
                            +91 98765 43210
                         </div>
                     </div>

                     <div className="bg-slate-100 p-5 rounded-2xl rounded-tr-none text-slate-800 text-sm leading-relaxed relative group">
                        <p>
                            Dear Customer, your electricity will be cut <span onClick={() => togglePattern('urgency')} className={`cursor-pointer border-b-2 transition-all font-bold ${isRevealed('urgency') ? 'text-red-600 border-red-500 bg-red-100 px-1 rounded' : 'border-slate-300'}`}>tonight at 9:30 PM</span> because your previous month bill was not updated.
                        </p>
                        <br/>
                        <p>
                            Please contact our electricity officer immediately <span onClick={() => togglePattern('number')} className={`cursor-pointer border-b-2 transition-all font-bold ${isRevealed('number') ? 'text-red-600 border-red-500 bg-red-100 px-1 rounded' : 'border-slate-300'}`}>829471XXXX</span>.
                        </p>
                        <br/>
                        <p>
                           Download the app to pay: <span onClick={() => togglePattern('apk')} className={`cursor-pointer border-b-2 transition-all font-bold font-mono ${isRevealed('apk') ? 'text-red-600 border-red-500 bg-red-100 px-1 rounded' : 'text-blue-600 border-blue-200'}`}>quicksupport.apk</span>
                        </p>
                        <br/>
                        <p>
                            Or visit: <span onClick={() => togglePattern('link')} className={`cursor-pointer border-b-2 transition-all font-bold font-mono ${isRevealed('link') ? 'text-red-600 border-red-500 bg-red-100 px-1 rounded' : 'text-blue-600 border-blue-200'}`}>http://hdbfc-netbanking.com</span>
                        </p>
                     </div>
                     <div className="text-[10px] text-slate-400 mt-2 ml-2">Received 9:30 AM</div>
                 </div>
             </div>
         </div>

         {/* LEGEND / EXPLANATION */}
         <div className="flex-1 space-y-4">
            <h3 className="text-xl font-bold text-slate-900 mb-6 uppercase tracking-wider">{t.anatomyBtn}</h3>
            
            {/* Pattern Cards */}
            <div 
                onClick={() => togglePattern('urgency')}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-start gap-4 ${isRevealed('urgency') ? 'border-red-500 bg-red-50 shadow-md' : 'border-slate-100 hover:border-slate-200 bg-white'}`}
            >
                <div className={`p-2 rounded-lg ${isRevealed('urgency') ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-400'}`}>
                    <Zap size={20} />
                </div>
                <div>
                    <h4 className={`font-bold ${isRevealed('urgency') ? 'text-red-900' : 'text-slate-700'}`}>{t.lessons.urgency.title}</h4>
                    <p className="text-sm text-slate-600 mt-1">{t.lessons.urgency.desc}</p>
                </div>
                {isRevealed('urgency') && <Check size={20} className="text-green-500 ml-auto" />}
            </div>

            <div 
                onClick={() => togglePattern('link')}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-start gap-4 ${isRevealed('link') ? 'border-red-500 bg-red-50 shadow-md' : 'border-slate-100 hover:border-slate-200 bg-white'}`}
            >
                <div className={`p-2 rounded-lg ${isRevealed('link') ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-400'}`}>
                    <Link2 size={20} />
                </div>
                <div>
                    <h4 className={`font-bold ${isRevealed('link') ? 'text-red-900' : 'text-slate-700'}`}>{t.lessons.link.title}</h4>
                    <p className="text-sm text-slate-600 mt-1">{t.lessons.link.desc}</p>
                </div>
                {isRevealed('link') && <Check size={20} className="text-green-500 ml-auto" />}
            </div>

            <div 
                onClick={() => togglePattern('apk')}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-start gap-4 ${isRevealed('apk') ? 'border-red-500 bg-red-50 shadow-md' : 'border-slate-100 hover:border-slate-200 bg-white'}`}
            >
                <div className={`p-2 rounded-lg ${isRevealed('apk') ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-400'}`}>
                    <Smartphone size={20} />
                </div>
                <div>
                    <h4 className={`font-bold ${isRevealed('apk') ? 'text-red-900' : 'text-slate-700'}`}>{t.lessons.apk.title}</h4>
                    <p className="text-sm text-slate-600 mt-1">{t.lessons.apk.desc}</p>
                </div>
                {isRevealed('apk') && <Check size={20} className="text-green-500 ml-auto" />}
            </div>
            
             <div 
                onClick={() => togglePattern('number')}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-start gap-4 ${isRevealed('number') ? 'border-red-500 bg-red-50 shadow-md' : 'border-slate-100 hover:border-slate-200 bg-white'}`}
            >
                <div className={`p-2 rounded-lg ${isRevealed('number') ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-400'}`}>
                    <ShieldAlert size={20} />
                </div>
                <div>
                    <h4 className={`font-bold ${isRevealed('number') ? 'text-red-900' : 'text-slate-700'}`}>{t.lessons.number.title}</h4>
                    <p className="text-sm text-slate-600 mt-1">{t.lessons.number.desc}</p>
                </div>
                {isRevealed('number') && <Check size={20} className="text-green-500 ml-auto" />}
            </div>

         </div>

      </div>
    </div>
  );
};
