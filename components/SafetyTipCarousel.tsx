import React, { useState, useEffect } from 'react';
import { Lock, Video, ShieldAlert, QrCode, ArrowDown, XCircle } from 'lucide-react';
import { translations } from '../i18n';
import { Language } from '../types';

interface SafetyTipCarouselProps {
    language?: Language;
}

export const SafetyTipCarousel: React.FC<SafetyTipCarouselProps> = ({ language = 'en' }) => {
  const t = translations[language].safetyTips;
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      id: 1,
      title: t.t1.title,
      desc: t.t1.desc,
      color: "bg-blue-50 border-blue-200 text-blue-600",
      illustration: (
        <div className="relative w-48 h-48 flex items-center justify-center">
          {/* Gentle Float Container */}
          <div className="animate-float" style={{ animationDuration: '6s' }}>
             <div className="w-24 h-40 bg-white border-4 border-slate-700 rounded-3xl shadow-2xl flex flex-col items-center justify-start pt-4 relative overflow-hidden">
                {/* Speaker Slot */}
                <div className="w-8 h-1.5 bg-slate-200 rounded-full mb-6"></div>
                
                {/* Password Dots with staggered pulse */}
                <div className="flex gap-2 justify-center mb-6">
                   <div className="w-3 h-3 bg-slate-300 rounded-full animate-pulse"></div>
                   <div className="w-3 h-3 bg-slate-300 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                   <div className="w-3 h-3 bg-slate-300 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                   <div className="w-3 h-3 bg-slate-300 rounded-full animate-pulse" style={{ animationDelay: '0.6s' }}></div>
                </div>

                {/* Secure Lock Icon - Subtle entrance */}
                <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center animate-pop-in" style={{ animationDelay: '0.3s' }}>
                    <Lock size={28} className="text-blue-600" />
                </div>
             </div>
          </div>
          
          {/* Badge - Clean design */}
          <div className="absolute top-0 right-0 transform translate-x-4 -translate-y-2 bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-lg animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
             {t.private}
          </div>
        </div>
      )
    },
    {
      id: 2,
      title: t.t2.title,
      desc: t.t2.desc,
      color: "bg-red-50 border-red-200 text-red-700",
      illustration: (
        <div className="relative w-48 h-48 flex items-center justify-center">
           {/* Soft Police Light Glow - Rotating gradient instead of harsh flash */}
           <div className="absolute inset-0 bg-gradient-to-tr from-red-400/20 via-transparent to-blue-400/20 rounded-full blur-2xl animate-spin" style={{ animationDuration: '4s' }}></div>
           
           <div className="animate-float" style={{ animationDuration: '7s' }}>
              <div className="w-40 h-28 bg-slate-800 rounded-2xl shadow-2xl flex items-center justify-center relative border-2 border-slate-600 overflow-hidden">
                  {/* Subtle interface elements */}
                  <div className="absolute top-3 left-3 w-full h-full opacity-10">
                      <div className="w-full h-0.5 bg-white/20 mb-3"></div>
                      <div className="w-full h-0.5 bg-white/20 mb-3"></div>
                  </div>

                  {/* Icon */}
                  <Video className="text-slate-500 opacity-80" size={42} />
                  
                  {/* Recording Dot - Subtle Blink */}
                  <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-black/40 px-2 py-1 rounded text-[10px] text-white font-mono">
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div> {t.rec}
                  </div>

                  {/* Alert Overlay */}
                  <div className="absolute -bottom-4 -right-4 bg-white p-2 rounded-full border border-red-100 shadow-md z-20 animate-pop-in">
                      <ShieldAlert size={24} className="text-red-500" />
                  </div>
              </div>
           </div>
        </div>
      )
    },
    {
      id: 3,
      title: t.t3.title,
      desc: t.t3.desc,
      color: "bg-orange-50 border-orange-200 text-orange-700",
      illustration: (
        <div className="relative w-48 h-48 flex items-center justify-center">
            <div className="animate-float" style={{ animationDuration: '5s' }}>
                <div className="relative bg-white p-4 rounded-2xl border-2 border-slate-200 shadow-2xl overflow-hidden">
                    <QrCode size={64} className="text-slate-800" />
                    
                    {/* Smooth Scan Line */}
                    <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-transparent to-orange-500/20 border-b-2 border-orange-500/50 animate-[scan_2.5s_ease-in-out_infinite]"></div>
                    
                    {/* Warning Icon Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-[1px]">
                        <div className="bg-orange-100 p-2 rounded-full">
                           <XCircle size={32} className="text-orange-600" />
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Context Text */}
            <div className="absolute -bottom-4 bg-orange-50 text-orange-800 text-xs font-bold px-3 py-1.5 rounded-lg border border-orange-100 shadow-sm animate-fade-in" style={{ animationDelay: '0.2s' }}>
                {t.dontScan}
            </div>
        </div>
      )
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000); // 5 seconds per slide
    return () => clearInterval(timer);
  }, [slides.length]);

  return (
    <div className="w-full h-full min-h-[600px] flex flex-col">
       <div className="flex-1 bg-white border border-slate-200 rounded-2xl p-8 relative overflow-hidden shadow-sm flex flex-col items-center justify-center text-center">
          
          {/* Subtle Background Elements */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-slate-50 rounded-full mix-blend-multiply filter blur-3xl opacity-50 -translate-y-1/2 translate-x-1/2 animate-pulse" style={{ animationDuration: '8s' }}></div>
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-50/50 rounded-full mix-blend-multiply filter blur-3xl opacity-50 translate-y-1/2 -translate-x-1/2 animate-pulse" style={{ animationDuration: '10s', animationDelay: '1s' }}></div>

          <div className="z-10 w-full max-w-lg mx-auto relative h-[28rem]">
             <div className="absolute top-0 w-full text-center uppercase tracking-widest text-xs font-bold text-slate-400 mb-8">Security Awareness</div>
             
             {/* Slide Container */}
             <div className="relative w-full h-full flex items-center justify-center mt-8">
                {slides.map((slide, index) => (
                    <div 
                        key={slide.id}
                        className={`absolute inset-0 flex flex-col items-center justify-center transition-all duration-700 ease-in-out px-4 ${
                            index === currentSlide 
                            ? 'opacity-100 scale-100 z-10 blur-0' 
                            : 'opacity-0 scale-95 z-0 blur-sm pointer-events-none'
                        }`}
                    >
                        {/* Illustration Circle */}
                        <div className={`w-64 h-64 rounded-full ${slide.color} bg-opacity-40 mb-8 flex items-center justify-center border-[6px] border-white shadow-xl`}>
                            {slide.illustration}
                        </div>
                        
                        <h3 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">{slide.title}</h3>
                        <p className="text-slate-500 text-lg font-medium leading-relaxed max-w-md mx-auto">{slide.desc}</p>
                    </div>
                ))}
             </div>
          </div>

          {/* Indicators */}
          <div className="z-20 flex gap-3 justify-center mt-6">
            {slides.map((_, idx) => (
                <button 
                    key={idx}
                    onClick={() => setCurrentSlide(idx)}
                    className={`h-2 rounded-full transition-all duration-500 ${
                        currentSlide === idx ? 'w-10 bg-slate-800' : 'w-2 bg-slate-200 hover:bg-slate-300'
                    }`}
                    aria-label={`Go to slide ${idx + 1}`}
                />
            ))}
          </div>
       </div>
       
       <style>{`
         @keyframes scan {
            0%, 100% { top: 0%; opacity: 0; }
            10% { opacity: 1; }
            90% { opacity: 1; }
            100% { top: 100%; opacity: 0; }
         }
       `}</style>
    </div>
  );
};