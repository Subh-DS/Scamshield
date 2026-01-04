import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Image as ImageIcon, ArrowRight, Lock, AlertOctagon, TrendingUp, Radio, Shield, Award, BookOpen, Target } from 'lucide-react';
import { Language } from '../types';
import { translations } from '../i18n';

interface HomeProps {
  onStart: () => void;
  onOpenRadar: () => void;
  onOpenEducation: () => void;
  onOpenSimulation: () => void;
  language: Language;
}

export const Home: React.FC<HomeProps> = ({ onStart, onOpenRadar, onOpenEducation, onOpenSimulation, language }) => {
  const t = translations[language].home;
  
  // Mascot Interactivity State
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [mascotMood, setMascotMood] = useState<'neutral' | 'happy' | 'surprised'>('neutral');
  const [mascotMessage, setMascotMessage] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Friendly Police Mascot (3D Style - Blue Uniform)
  const MASCOT_IMAGE_URL = "https://cdn-icons-png.flaticon.com/512/4333/4333609.png"; 
  const THUMBS_UP_URL = "https://cdn-icons-png.flaticon.com/512/11520/11520476.png"; // 3D Thumbs up icon
  const FALLBACK_IMAGE_URL = "https://cdn-icons-png.flaticon.com/512/4662/4662493.png"; 

  // Tips for mascot interaction
  const tips = language === 'hi' ? [
    "सुरक्षा के लिए थम्स अप! 👍", "मैं नज़र रख रहा हूँ!", "1930 डायल करें।"
  ] : language === 'or' ? [
    "ସୁରକ୍ଷା ପାଇଁ ଥମ୍ବସ୍ ଅପ୍! 👍", "ମୁଁ ନଜର ରଖିଛି!", "1930 ଡାଏଲ୍ କରନ୍ତୁ |"
  ] : [
    "Thumbs up for safety! 👍", "I'm keeping an eye out!", "Dial 1930 for Cyber Help."
  ];

  // Hardcode active scams display for home page
  const activeScams = [
    {
      title: language === 'en' ? "Digital Arrest" : language === 'hi' ? "डिजिटल अरेस्ट" : "ଡିଜିଟାଲ୍ ଗିରଫ",
      desc: language === 'en' ? "Warning: Officials never interrogate on video calls." : language === 'hi' ? "चेतावनी: अधिकारी वीडियो कॉल पर पूछताछ नहीं करते।" : "ସତର୍କତା: ଅଧିକାରୀମାନେ ଭିଡିଓ କଲରେ ପଚରାଉଚରା କରନ୍ତି ନାହିଁ |",
      risk: language === 'en' ? "Critical" : language === 'hi' ? "गंभीर" : "ଗୁରୁତର",
      color: "bg-red-50 border-red-200 text-red-800"
    },
    {
      title: language === 'en' ? "Part-time Job" : language === 'hi' ? "पार्ट-टाइम जॉब" : "ପାର୍ଟ ଟାଇମ୍ ଚାକିରି",
      desc: language === 'en' ? "Risk: Asking for payment to get salary." : language === 'hi' ? "जोखिम: वेतन पाने के लिए भुगतान मांगना।" : "ବିପଦ: ଦରମା ପାଇବା ପାଇଁ ଟଙ୍କା ମାଗିବା |",
      risk: language === 'en' ? "High" : language === 'hi' ? "उच्च" : "ଉଚ୍ଚ",
      color: "bg-orange-50 border-orange-200 text-orange-800"
    },
    {
      title: language === 'en' ? "Electricity KYC" : language === 'hi' ? "बिजली केवाईसी" : "ବିଦ୍ୟୁତ୍ KYC",
      desc: language === 'en' ? "Alert: Threat of disconnection is a tactic." : language === 'hi' ? "चेतावनी: कनेक्शन काटने की धमकी एक चाल है।" : "ସତର୍କତା: ସଂଯୋଗ କାଟିବାର ଧମକ ଏକ ଚାଲ୍ |",
      risk: language === 'en' ? "High" : language === 'hi' ? "उच्च" : "ଉଚ୍ଚ",
      color: "bg-yellow-50 border-yellow-200 text-yellow-800"
    }
  ];

  // 2.5D Parallax Tilt Logic
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      
      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      // Calculate distance from center
      const posX = e.clientX - centerX;
      const posY = e.clientY - centerY;

      // Sensitivity
      const rotateX = (posY / 20) * -1; 
      const rotateY = (posX / 20);

      const limitedX = Math.min(Math.max(rotateX, -15), 15);
      const limitedY = Math.min(Math.max(rotateY, -15), 15);

      setTilt({ x: limitedX, y: limitedY });
    };

    const handleMouseLeave = () => {
      setTilt({ x: 0, y: 0 }); 
    };

    const element = containerRef.current;
    if (element) {
        element.addEventListener('mousemove', handleMouseMove);
        element.addEventListener('mouseleave', handleMouseLeave);
    }
    return () => {
        if (element) {
            element.removeEventListener('mousemove', handleMouseMove);
            element.removeEventListener('mouseleave', handleMouseLeave);
        }
    };
  }, []);

  const handleMascotClick = () => {
    if (mascotMood === 'happy') return;
    
    setMascotMood('happy');
    const randomTip = tips[Math.floor(Math.random() * tips.length)];
    setMascotMessage(randomTip);

    setTimeout(() => {
      setMascotMood('neutral');
      setMascotMessage(null);
    }, 2500);
  };

  const handleCardHover = (risk: string) => {
    // Check if risk string indicates high severity in any language
    if ((risk.includes('Critical') || risk.includes('गंभीर') || risk.includes('ଗୁରୁତର')) && mascotMood !== 'surprised') {
        setMascotMood('surprised');
        setMascotMessage(t.highRiskAlert);
    }
  };

  const handleCardLeave = () => {
    if (mascotMood === 'surprised') {
        setMascotMood('neutral');
        setMascotMessage(null);
    }
  };

  return (
    <div className="flex flex-col items-center overflow-hidden w-full bg-slate-50">
      
      {/* Hero Section */}
      <section className="w-full max-w-6xl mx-auto px-6 py-12 sm:py-16 flex flex-col md:flex-row items-center gap-12 min-h-[600px]">
        
        {/* Left: Text Content */}
        <div className="flex-1 text-center md:text-left z-10 animate-fade-in-up">
           <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 shadow-sm mb-6 hover:shadow-md transition-shadow cursor-default">
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-600"></span>
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">{t.badge}</span>
           </div>

           <h1 className="text-5xl sm:text-7xl font-black text-slate-900 tracking-tight mb-8 leading-normal drop-shadow-sm">
             {t.heroTitle} <span className="text-blue-600 inline-block">{t.heroTitleColor}</span> <br />
             <span className="text-4xl sm:text-5xl font-extrabold text-slate-700 block mt-3 leading-normal">{t.heroSubtitle}</span>
           </h1>
           
           <p className="text-lg text-slate-600 font-medium mb-10 leading-loose max-w-lg mx-auto md:mx-0">
             {t.heroDesc}
           </p>

           <div className="flex flex-col sm:flex-row items-center gap-4 justify-center md:justify-start">
              <button
                onClick={onStart}
                className="group relative inline-flex items-center gap-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 rounded-xl text-xl font-bold shadow-lg shadow-blue-500/30 hover:shadow-xl hover:-translate-y-1 transition-all"
              >
                {t.btnStart}
                <ArrowRight className="group-hover:translate-x-1 transition-transform stroke-[3]" />
              </button>
              
              <div className="flex gap-3">
                  <button
                    onClick={onOpenRadar}
                    className="group relative inline-flex items-center gap-2 bg-slate-900 text-white px-6 py-4 rounded-xl text-lg font-bold shadow-lg shadow-slate-900/30 hover:shadow-xl hover:-translate-y-1 transition-all"
                  >
                    <Radio className="animate-pulse text-red-400" /> {t.btnRadar}
                  </button>
              </div>
           </div>
        </div>

        {/* Right: Mascot Area (3D & Interactive) */}
        <div 
          ref={containerRef}
          className="flex-1 relative flex items-center justify-center h-full w-full min-h-[500px] perspective-container cursor-pointer select-none"
          onClick={handleMascotClick}
        >
            {/* Background Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] h-[340px] bg-gradient-to-b from-blue-400 to-blue-600 rounded-full shadow-2xl border-4 border-white/30 animate-float" style={{ animationDuration: '6s' }}></div>
            <div className="absolute inset-0 bg-blue-400/20 rounded-full blur-3xl opacity-50 animate-pulse translate-z-[-200px]"></div>

            {/* Mascot Message Bubble */}
            {mascotMessage && (
                <div className="absolute top-0 right-0 z-50 animate-pop-in">
                    <div className="bg-white border-2 border-slate-900 p-4 rounded-2xl rounded-bl-none shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] whitespace-nowrap transform -rotate-1 relative">
                        <p className="font-bold text-slate-900 text-lg flex items-center gap-2">
                             🛡️ {mascotMessage}
                        </p>
                    </div>
                </div>
            )}

            {/* 3D Container with Tilt Effect */}
            <div 
                className="relative transition-transform duration-300 ease-out preserve-3d group z-10"
                style={{ 
                    transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale(${mascotMood === 'happy' ? 1.1 : 1})`,
                    transformStyle: 'preserve-3d'
                }}
            >
                <div className="relative w-64 h-64 sm:w-80 sm:h-80">
                    {/* Main Mascot Image */}
                    <img 
                        src={MASCOT_IMAGE_URL} 
                        alt="3D Police Mascot" 
                        className={`w-full h-full object-contain filter drop-shadow-2xl transition-all duration-300 ${mascotMood === 'surprised' ? 'scale-110' : ''}`}
                        onError={(e) => {
                            e.currentTarget.src = FALLBACK_IMAGE_URL;
                        }}
                    />
                    
                    {/* Floating Thumbs Up Gesture (Added as separate layer for depth) */}
                    <div className="absolute top-20 -right-4 animate-bounce-soft" style={{ animationDelay: '0.2s' }}>
                         <img 
                            src={THUMBS_UP_URL} 
                            alt="Thumbs Up"
                            className="w-16 h-16 object-contain drop-shadow-lg transform rotate-12 hover:scale-110 transition-transform"
                         />
                    </div>

                     {/* Verified Shield */}
                     <div className="absolute top-1/2 -left-6 animate-float" style={{ animationDelay: '1s' }}>
                         <div className="bg-white p-2 rounded-xl shadow-lg border-2 border-blue-100 flex items-center gap-2 transform -rotate-6">
                             <Shield className="text-blue-600 fill-blue-100" size={24} />
                             <span className="text-xs font-bold text-slate-700">{t.verified}</span>
                         </div>
                    </div>
                </div>
                
                {mascotMood === 'surprised' && (
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-20 h-20 bg-red-500 rounded-full filter blur-3xl opacity-60 animate-pulse"></div>
                )}
            </div>
        </div>
      </section>
      
      {/* Training Camp (Education & Simulation) */}
      <section className="w-full max-w-5xl mx-auto px-6 mb-16">
         <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest text-center mb-6">Training Camp</h3>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <button 
                onClick={onOpenSimulation}
                className="flex items-center p-6 bg-white border-2 border-slate-100 rounded-2xl hover:border-blue-500 hover:shadow-xl transition-all group text-left"
            >
                <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mr-6 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <Target size={32} />
                </div>
                <div>
                    <h4 className="text-xl font-bold text-slate-900 mb-1 group-hover:text-blue-600 transition-colors">{t.btnSim}</h4>
                    <p className="text-slate-500 text-sm">Play the Scam Dojo game</p>
                </div>
                <div className="ml-auto opacity-0 group-hover:opacity-100 transform translate-x-[-10px] group-hover:translate-x-0 transition-all">
                    <ArrowRight className="text-blue-500" />
                </div>
            </button>

            <button 
                onClick={onOpenEducation}
                className="flex items-center p-6 bg-white border-2 border-slate-100 rounded-2xl hover:border-indigo-500 hover:shadow-xl transition-all group text-left"
            >
                <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mr-6 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                    <BookOpen size={32} />
                </div>
                <div>
                    <h4 className="text-xl font-bold text-slate-900 mb-1 group-hover:text-indigo-600 transition-colors">{t.btnEdu}</h4>
                    <p className="text-slate-500 text-sm">Pattern-based learning</p>
                </div>
                 <div className="ml-auto opacity-0 group-hover:opacity-100 transform translate-x-[-10px] group-hover:translate-x-0 transition-all">
                    <ArrowRight className="text-indigo-500" />
                </div>
            </button>
         </div>
      </section>

      {/* Trending Alerts */}
      <section className="w-full max-w-5xl mx-auto px-6 mb-16">
        <div className="flex items-center gap-3 mb-8 justify-center sm:justify-start">
             <div className="bg-red-600 text-white p-2 rounded-lg shadow-md transform -rotate-3">
                <TrendingUp size={24} strokeWidth={2.5} />
             </div>
             <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">{t.activeScamsTitle}</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {activeScams.map((scam, idx) => (
                <div 
                    key={idx} 
                    onMouseEnter={() => handleCardHover(scam.risk)}
                    onMouseLeave={handleCardLeave}
                    className={`relative p-6 rounded-xl border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] hover:translate-y-[-4px] hover:shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] transition-all duration-300 bg-white group cursor-default`}
                >
                    <div className={`absolute top-0 left-0 w-full h-1.5 ${scam.color.includes('bg-red') ? 'bg-red-500' : scam.color.includes('bg-orange') ? 'bg-orange-500' : 'bg-yellow-500'}`}></div>
                    
                    <div className="flex justify-between items-start mb-4">
                         <div className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wider ${scam.color}`}>
                            {scam.risk} {t.riskLabel}
                         </div>
                         <AlertOctagon size={20} className="text-slate-900 group-hover:rotate-12 transition-transform" />
                    </div>
                    
                    <h4 className="text-lg font-black text-slate-900 mb-2 leading-normal">{scam.title}</h4>
                    <p className="text-slate-500 text-sm font-medium leading-relaxed">{scam.desc}</p>
                </div>
            ))}
        </div>
      </section>

      {/* NEW IMPROVED Features Section - Dark Background for Contrast */}
      <section className="w-full bg-slate-900 py-16 text-white relative overflow-hidden">
        {/* Decorative Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:32px_32px] opacity-20 pointer-events-none"></div>

        <div className="max-w-6xl mx-auto px-6 relative z-10">
          <div className="text-center mb-12">
             <h2 className="text-3xl font-black text-white mb-4">{t.featuresTitle}</h2>
             <p className="text-slate-400 text-lg font-medium">{t.featuresSubtitle}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-white rounded-2xl p-8 shadow-xl hover:shadow-2xl hover:shadow-blue-900/50 transition-all duration-300 transform hover:-translate-y-2 group">
              <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-sm group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <MessageSquare size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">{t.f1Title}</h3>
              <p className="text-slate-600 leading-relaxed">
                {t.f1Desc}
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white rounded-2xl p-8 shadow-xl hover:shadow-2xl hover:shadow-purple-900/50 transition-all duration-300 transform hover:-translate-y-2 group">
              <div className="w-16 h-16 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mb-6 shadow-sm group-hover:bg-purple-600 group-hover:text-white transition-colors">
                <ImageIcon size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">{t.f2Title}</h3>
              <p className="text-slate-600 leading-relaxed">
                {t.f2Desc}
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white rounded-2xl p-8 shadow-xl hover:shadow-2xl hover:shadow-red-900/50 transition-all duration-300 transform hover:-translate-y-2 group">
              <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mb-6 shadow-sm group-hover:bg-red-600 group-hover:text-white transition-colors">
                <Lock size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">{t.f3Title}</h3>
              <p className="text-slate-600 leading-relaxed">
                {t.f3Desc}
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};