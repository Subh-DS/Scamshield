import React, { useState, useCallback, useEffect } from 'react';
import { AnalysisInput } from './components/AnalysisInput';
import { AnalysisResultCard } from './components/AnalysisResultCard';
import { Home } from './components/Home';
import { LiveScanner } from './components/LiveScanner';
import { SafetyTipCarousel } from './components/SafetyTipCarousel';
import { ScamRadar } from './components/ScamRadar';
import { ScamEducation } from './components/ScamEducation';
import { ScamSimulation } from './components/ScamSimulation';
import { analyzeContent } from './services/geminiService';
import { AnalysisResult, AnalysisType, ScamContext, Language, ViewState } from './types';
import { ShieldCheck, ChevronLeft, Globe, Minus, Plus, Type, AlertTriangle, X } from 'lucide-react';
import { translations } from './i18n';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('home');
  const [isLiveScanning, setIsLiveScanning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [language, setLanguage] = useState<Language>('en');
  const [fontSizePercent, setFontSizePercent] = useState(100);

  const t = translations[language];

  // Magnifier Effect: Apply font-size to root html element
  useEffect(() => {
    document.documentElement.style.fontSize = `${fontSizePercent}%`;
  }, [fontSizePercent]);

  const handleAnalysis = useCallback(async (content: string | File, type: AnalysisType, context: ScamContext) => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await analyzeContent(content, type, context, language);
      setResult(data);
    } catch (err: any) {
      console.error("Analysis failed:", err);
      setError(err.message || "An unexpected error occurred during analysis.");
    } finally {
      setLoading(false);
    }
  }, [language]);

  const resetAnalysis = () => {
    setResult(null);
    setError(null);
  };

  const navigateToHome = () => {
    setView('home');
    resetAnalysis();
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans selection:bg-blue-100 selection:text-blue-900">
      
      {/* Live Scanner Overlay */}
      {isLiveScanning && (
        <LiveScanner onClose={() => setIsLiveScanning(false)} language={language} />
      )}

      {/* Global Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <button 
            onClick={navigateToHome}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <div className="bg-gradient-to-tr from-blue-600 to-indigo-600 p-2 rounded-lg text-white shadow-md">
              <ShieldCheck size={20} />
            </div>
            <h1 className="hidden sm:block text-xl font-bold text-slate-900 tracking-tight">ScamShield</h1>
            <h1 className="sm:hidden text-lg font-bold text-slate-900 tracking-tight">Satark</h1>
          </button>
          
          <div className="flex items-center gap-2 sm:gap-4">
             {/* Magnifier Controls - Now visible on all screens */}
             <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1 mr-1">
                <button 
                  onClick={() => setFontSizePercent(p => Math.max(85, p - 10))}
                  className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-white rounded-md transition-all"
                  title="Decrease Font Size"
                >
                  <Minus size={14} />
                </button>
                <div className="w-px h-4 bg-slate-200 mx-1"></div>
                <button 
                  onClick={() => setFontSizePercent(100)}
                  className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-white rounded-md transition-all font-bold text-xs"
                  title="Reset Font Size"
                >
                  <Type size={14} />
                </button>
                <div className="w-px h-4 bg-slate-200 mx-1"></div>
                <button 
                  onClick={() => setFontSizePercent(p => Math.min(125, p + 10))}
                  className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-white rounded-md transition-all"
                  title="Increase Font Size"
                >
                  <Plus size={14} />
                </button>
             </div>

             {/* Language Switcher */}
             <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
                <button 
                  onClick={() => setLanguage('en')}
                  className={`px-2 sm:px-3 py-1.5 text-xs font-bold rounded-md transition-all ${language === 'en' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
                >
                  English
                </button>
                <button 
                  onClick={() => setLanguage('hi')}
                  className={`px-2 sm:px-3 py-1.5 text-xs font-bold rounded-md transition-all ${language === 'hi' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
                >
                  हिन्दी
                </button>
                <button 
                  onClick={() => setLanguage('or')}
                  className={`px-2 sm:px-3 py-1.5 text-xs font-bold rounded-md transition-all ${language === 'or' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
                >
                  ଓଡ଼ିଆ
                </button>
             </div>

             <nav>
                {view !== 'home' && (
                  <button 
                    onClick={navigateToHome}
                    className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors flex items-center gap-1 ml-2"
                  >
                    <ChevronLeft size={16} />
                    <span className="hidden sm:inline">Back</span>
                  </button>
                )}
              </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex flex-col">
        {view === 'home' ? (
          <Home 
            onStart={() => setView('analyze')} 
            onOpenRadar={() => setView('radar')}
            onOpenEducation={() => setView('education')}
            onOpenSimulation={() => setView('simulation')}
            language={language}
          />
        ) : view === 'radar' ? (
          <ScamRadar onBack={navigateToHome} language={language} />
        ) : view === 'education' ? (
          <ScamEducation onBack={navigateToHome} language={language} />
        ) : view === 'simulation' ? (
          <ScamSimulation onBack={navigateToHome} language={language} />
        ) : (
          <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 animate-fade-in">
             <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">
                    {language === 'en' ? 'Analyze Content' : language === 'hi' ? 'सामग्री का विश्लेषण करें' : 'ବିଷୟବସ୍ତୁ ବିଶ୍ଳେଷଣ କରନ୍ତୁ'}
                  </h2>
                  <p className="text-slate-600">
                    {language === 'en' 
                      ? 'Scan text, images, or URLs for fraud.' 
                      : language === 'hi' 
                      ? 'धोखाधड़ी के लिए टेक्स्ट, इमेज या लिंक स्कैन करें।' 
                      : 'ଠକେଇ ପାଇଁ ଟେକ୍ସଟ୍, ଇମେଜ୍ କିମ୍ବା ଲିଙ୍କ୍ ସ୍କାନ୍ କରନ୍ତୁ |'}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200">
                   <Globe size={14} />
                   Language: {language === 'en' ? 'English' : language === 'hi' ? 'Hindi' : 'Odia'}
                </div>
             </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Column: Input */}
              <div className="lg:col-span-5 space-y-6">
                <AnalysisInput 
                  onAnalyze={handleAnalysis} 
                  isLoading={loading} 
                  onStartLiveScan={() => setIsLiveScanning(true)}
                  language={language}
                />
              </div>

              {/* Right Column: Results */}
              <div className="lg:col-span-7">
                 {error && (
                  <div className="bg-red-50 border border-red-200 rounded-2xl p-6 mb-8 animate-fade-in flex items-start gap-4 shadow-sm relative group">
                    <div className="bg-red-100 text-red-600 p-3 rounded-full flex-shrink-0">
                       <AlertTriangle size={24} />
                    </div>
                    <div className="flex-1">
                       <h3 className="text-lg font-bold text-red-900 mb-1">
                         {language === 'en' ? 'Analysis could not be completed' : language === 'hi' ? 'विश्लेषण पूरा नहीं हो सका' : 'ବିଶ୍ଳେଷଣ ସମ୍ପୂର୍ଣ୍ଣ ହୋଇପାରିଲା ନାହିଁ'}
                       </h3>
                       <p className="text-red-700 mb-4 text-sm leading-relaxed">
                         {error}
                       </p>
                       
                       <div className="bg-white/60 rounded-xl p-4 text-sm text-red-800 border border-red-100">
                          <p className="font-bold mb-2 uppercase text-xs tracking-wider opacity-70">
                            {language === 'en' ? 'Suggested Actions' : language === 'hi' ? 'सुझाव' : 'ପରାମର୍ଶ'}
                          </p>
                          <ul className="space-y-2">
                             <li className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-red-400"></div>
                                {language === 'en' ? 'Check your internet connection' : language === 'hi' ? 'अपना इंटरनेट कनेक्शन जांचें' : 'ଆପଣଙ୍କର ଇଣ୍ଟରନେଟ୍ ସଂଯୋଗ ଯାଞ୍ଚ କରନ୍ତୁ'}
                             </li>
                             <li className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-red-400"></div>
                                 {language === 'en' ? 'Ensure text or image is clear' : language === 'hi' ? 'सुनिश्चित करें कि टेक्स्ट/इमेज स्पष्ट है' : 'ବିଷୟବସ୍ତୁ ସ୍ପଷ୍ଟ ଅଛି କି ନାହିଁ ଦେଖନ୍ତୁ'}
                             </li>
                             <li className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-red-400"></div>
                                 {language === 'en' ? 'Try shortening the content' : language === 'hi' ? 'सामग्री को छोटा करने का प्रयास करें' : 'ବିଷୟବସ୍ତୁ ଛୋଟ କରିବାକୁ ଚେଷ୍ଟା କରନ୍ତୁ'}
                             </li>
                          </ul>
                       </div>
                    </div>
                    <button 
                        onClick={() => setError(null)} 
                        className="absolute top-4 right-4 text-red-400 hover:text-red-600 transition-colors bg-white/50 hover:bg-white rounded-full p-1"
                        aria-label="Dismiss error"
                    >
                        <X size={16} />
                    </button>
                  </div>
                )}

                {loading ? (
                  <div className="bg-white border border-slate-200 rounded-xl p-12 shadow-sm flex flex-col items-center justify-center min-h-[500px] text-center">
                    <div className="relative w-20 h-20 mb-6">
                      <div className="absolute top-0 left-0 w-full h-full border-4 border-blue-100 rounded-full"></div>
                      <div className="absolute top-0 left-0 w-full h-full border-4 border-blue-600 rounded-full animate-spin border-t-transparent"></div>
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900">
                      {language === 'en' ? 'Analyzing...' : language === 'hi' ? 'विश्लेषण हो रहा है...' : 'ବିଶ୍ଳେଷଣ କରାଯାଉଛି...'}
                    </h3>
                    <p className="text-slate-500 mt-2 max-w-xs mx-auto">
                      {language === 'en' ? 'Checking for urgency, malicious links, and fraud patterns.' : 'धोखाधड़ी के पैटर्न की जाँच की जा रही है।'}
                    </p>
                  </div>
                ) : result ? (
                  <AnalysisResultCard result={result} onReset={resetAnalysis} language={language} />
                ) : (
                  <SafetyTipCarousel language={language} />
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-8">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-slate-900 font-semibold mb-2">ScamShield</p>
          <p className="text-slate-500 text-sm mb-4">Protecting you from digital financial fraud.</p>
          <p className="text-xs text-slate-400">
            © {new Date().getFullYear()} ScamShield. Hackathon MVP. 
            <br /> Disclaimer: AI analysis may make mistakes. Always verify with official institutions.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;