import React, { useState, useRef } from 'react';
import { AnalysisType, ScamContext, Language } from '../types';
import { Image, UploadCloud, FileText, X, ArrowRight, Smartphone, Mail, MessageCircle, Heart, ShoppingBag, Globe, CreditCard, HelpCircle, Camera, Link as LinkIcon, Mic, Square, Loader2 } from 'lucide-react';
import { transcribeAudio } from '../services/geminiService';
import { translations } from '../i18n';

interface AnalysisInputProps {
  onAnalyze: (content: string | File, type: AnalysisType, context: ScamContext) => void;
  isLoading: boolean;
  onStartLiveScan: () => void;
  language: Language;
}

export const AnalysisInput: React.FC<AnalysisInputProps> = ({ onAnalyze, isLoading, onStartLiveScan, language }) => {
  const t = translations[language].analysisInput;
  const [activeTab, setActiveTab] = useState<'text' | 'image' | 'url' | 'voice' | 'camera'>('text');
  const [context, setContext] = useState<ScamContext>('sms');
  const [textContent, setTextContent] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  // Voice Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeTab === 'text' && textContent.trim()) {
      onAnalyze(textContent, 'text', context);
    } else if (activeTab === 'url' && textContent.trim()) {
      onAnalyze(textContent, 'url', 'url');
    } else if (activeTab === 'image' && selectedFile) {
      onAnalyze(selectedFile, 'image', context);
    } else if (activeTab === 'voice' && textContent.trim()) {
      // If user records and then hits scan immediately from Voice tab (if we decide to allow that)
      // But typically we switch them to text. Let's handle it if they stay on voice tab but have text.
      onAnalyze(textContent, 'text', context);
    }
  };

  // Recording Logic
  const startRecording = async () => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                audioChunksRef.current.push(event.data);
            }
        };

        mediaRecorder.onstop = async () => {
            const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
            stream.getTracks().forEach(track => track.stop()); // Stop mic
            
            setIsTranscribing(true);
            try {
                const text = await transcribeAudio(audioBlob);
                setTextContent(text);
                setActiveTab('text'); // Switch to text tab to show result and allow edit
            } catch (err) {
                console.error("Transcription failed", err);
                alert("Could not transcribe audio. Please try again.");
            } finally {
                setIsTranscribing(false);
                setIsRecording(false);
            }
        };

        mediaRecorder.start();
        setIsRecording(true);
    } catch (err) {
        console.error("Mic access denied:", err);
        alert("Please allow microphone access to use voice features.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop();
    }
  };

  const isSubmitDisabled = isLoading || (activeTab === 'text' || activeTab === 'voice' || activeTab === 'url' ? !textContent.trim() : !selectedFile);

  const contextOptions: { value: ScamContext; label: string; icon: React.ReactNode }[] = [
    { value: 'sms', label: 'SMS / Text', icon: <Smartphone size={16} /> },
    { value: 'whatsapp', label: 'WhatsApp', icon: <MessageCircle size={16} /> },
    { value: 'email', label: 'Email', icon: <Mail size={16} /> },
    { value: 'social_media', label: 'Social Media', icon: <Globe size={16} /> },
    { value: 'banking', label: 'Banking', icon: <CreditCard size={16} /> },
    { value: 'other', label: 'Other', icon: <HelpCircle size={16} /> },
  ];

  return (
    <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
      <div className="p-6">
        {/* Pill Tabs */}
        <div className="flex bg-slate-100 p-1 rounded-xl mb-6 overflow-x-auto">
          <button
            onClick={() => setActiveTab('text')}
            className={`flex-1 min-w-[70px] flex items-center justify-center gap-2 py-2.5 text-xs sm:text-sm font-semibold rounded-lg transition-all ${
              activeTab === 'text'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <FileText size={16} />
            <span className="hidden sm:inline">{t.tabs.text}</span>
          </button>
           <button
            onClick={() => setActiveTab('url')}
            className={`flex-1 min-w-[70px] flex items-center justify-center gap-2 py-2.5 text-xs sm:text-sm font-semibold rounded-lg transition-all ${
              activeTab === 'url'
                ? 'bg-white text-purple-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <LinkIcon size={16} />
            <span className="hidden sm:inline">{t.tabs.link}</span>
          </button>
          <button
            onClick={() => setActiveTab('image')}
            className={`flex-1 min-w-[70px] flex items-center justify-center gap-2 py-2.5 text-xs sm:text-sm font-semibold rounded-lg transition-all ${
              activeTab === 'image'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Image size={16} />
            <span className="hidden sm:inline">{t.tabs.image}</span>
          </button>
          <button
            onClick={() => setActiveTab('voice')}
            className={`flex-1 min-w-[70px] flex items-center justify-center gap-2 py-2.5 text-xs sm:text-sm font-semibold rounded-lg transition-all ${
              activeTab === 'voice'
                ? 'bg-white text-red-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Mic size={16} />
            <span className="hidden sm:inline">{t.tabs.voice}</span>
          </button>
          <button
            onClick={() => setActiveTab('camera')}
            className={`flex-1 min-w-[70px] flex items-center justify-center gap-2 py-2.5 text-xs sm:text-sm font-semibold rounded-lg transition-all ${
              activeTab === 'camera'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Camera size={16} />
            <span className="hidden sm:inline">{t.tabs.live}</span>
          </button>
        </div>

        {activeTab === 'camera' ? (
          <div className="text-center py-8 animate-fade-in">
             <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6 text-blue-600">
                <Camera size={40} />
             </div>
             <h3 className="text-xl font-bold text-slate-900 mb-2">{t.liveTitle}</h3>
             <p className="text-slate-600 mb-8 max-w-sm mx-auto text-sm">
                {t.liveDesc}
             </p>
             <button
                type="button"
                onClick={onStartLiveScan}
                className="w-full py-4 px-6 rounded-xl font-bold text-white shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 transition-all transform active:scale-[0.99] bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 hover:shadow-xl hover:-translate-y-0.5"
             >
                <Camera size={20} />
                {t.openScannerBtn}
             </button>
          </div>
        ) : activeTab === 'voice' ? (
           <div className="text-center py-8 animate-fade-in flex flex-col items-center justify-center min-h-[300px]">
              
              {isTranscribing ? (
                  <>
                     <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mb-6 animate-pulse">
                         <Loader2 size={48} className="text-blue-600 animate-spin" />
                     </div>
                     <h3 className="text-xl font-bold text-slate-900 mb-2">{t.voice.transcribing}</h3>
                     <p className="text-slate-500 text-sm">Converting your audio to text using Gemini.</p>
                  </>
              ) : isRecording ? (
                  <>
                     <div className="relative w-24 h-24 flex items-center justify-center mb-6 cursor-pointer" onClick={stopRecording}>
                         <div className="absolute inset-0 bg-red-100 rounded-full animate-ping opacity-75"></div>
                         <div className="relative w-24 h-24 bg-red-500 rounded-full flex items-center justify-center shadow-lg shadow-red-500/40 hover:scale-105 transition-transform">
                             <Square size={32} className="text-white fill-white" />
                         </div>
                     </div>
                     <h3 className="text-xl font-bold text-slate-900 mb-2">{t.voice.recording}</h3>
                     <p className="text-slate-500 text-sm">Tap the button to stop and analyze.</p>
                  </>
              ) : (
                  <>
                     <button 
                        onClick={startRecording}
                        className="w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center mb-6 shadow-xl shadow-blue-500/30 hover:scale-105 hover:bg-blue-700 transition-all group"
                     >
                         <Mic size={40} className="text-white group-hover:scale-110 transition-transform" />
                     </button>
                     <h3 className="text-xl font-bold text-slate-900 mb-2">{t.voice.tapToRecord}</h3>
                     <p className="text-slate-500 text-sm max-w-xs">
                        {t.voice.desc}
                     </p>
                  </>
              )}
           </div>
        ) : (
          <form onSubmit={handleSubmit}>
            
            {/* Source Selector (Only show for text/image/voice) */}
            {activeTab !== 'url' && (
              <div className="mb-6 animate-fade-in">
                <label className="block text-sm font-medium text-slate-700 ml-1 mb-1">
                    {t.sourceLabel}
                  </label>
                  {/* Source Helper */}
                  <p className="text-xs text-slate-500 ml-1 mb-3">
                     {t.helpers?.source}
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {contextOptions.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setContext(opt.value)}
                          className={`flex items-center gap-2 px-3 py-2 text-xs sm:text-sm rounded-lg border transition-all ${
                            context === opt.value
                              ? 'border-blue-500 bg-blue-50 text-blue-700 font-medium'
                              : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          <span className={context === opt.value ? 'text-blue-500' : 'text-slate-400'}>{opt.icon}</span>
                          {opt.label}
                        </button>
                    ))}
                  </div>
              </div>
            )}

            {activeTab === 'text' && (
              <div className="space-y-4 animate-fade-in">
                <label className="block text-sm font-medium text-slate-700 ml-1">
                  {t.textLabel}
                </label>
                 {/* Text Helper */}
                 <p className="text-xs text-slate-500 ml-1 -mt-3 mb-2">
                    {t.helpers?.text}
                </p>
                <textarea
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  placeholder={t.textPlaceholder}
                  className="w-full h-32 p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none text-slate-800 placeholder-slate-400 transition-all text-base leading-relaxed"
                  disabled={isLoading}
                />
              </div>
            )}

            {activeTab === 'url' && (
              <div className="space-y-4 animate-fade-in">
                <label className="block text-sm font-medium text-slate-700 ml-1">
                  {t.urlLabel}
                </label>
                 {/* URL Helper */}
                 <p className="text-xs text-slate-500 ml-1 -mt-3 mb-2">
                    {t.helpers?.url}
                </p>
                <input
                  type="url"
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  placeholder={t.urlPlaceholder}
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 text-slate-800 placeholder-slate-400 transition-all text-base"
                  disabled={isLoading}
                />
              </div>
            )}

            {activeTab === 'image' && (
              <div className="space-y-4 animate-fade-in">
                <label className="block text-sm font-medium text-slate-700 ml-1">
                  {t.uploadLabel}
                </label>
                 {/* Image Helper */}
                 <p className="text-xs text-slate-500 ml-1 -mt-3 mb-2">
                    {t.helpers?.image}
                </p>
                
                {!selectedFile ? (
                  <div className="relative border-2 border-dashed border-slate-300 rounded-xl p-8 hover:bg-slate-50 hover:border-blue-400 transition-all group cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      disabled={isLoading}
                    />
                    <div className="flex flex-col items-center justify-center text-slate-500 group-hover:text-blue-500 transition-colors">
                      <div className="bg-white p-3 rounded-full shadow-sm mb-3 group-hover:shadow-md transition-shadow">
                          <UploadCloud size={28} />
                      </div>
                      <p className="text-base font-semibold">{t.clickToUpload}</p>
                      <p className="text-xs mt-1 text-slate-400">PNG, JPG</p>
                    </div>
                  </div>
                ) : (
                  <div className="relative rounded-xl border border-slate-200 overflow-hidden bg-slate-50 group">
                    <button
                      type="button"
                      onClick={clearFile}
                      className="absolute top-2 right-2 p-1.5 bg-white/90 backdrop-blur rounded-full shadow-sm text-slate-500 hover:text-red-500 hover:bg-red-50 transition-colors z-20"
                    >
                      <X size={16} />
                    </button>
                    <div className="flex flex-col sm:flex-row items-center p-4 gap-4">
                      {previewUrl && (
                        <div className="relative h-24 w-full sm:w-24 flex-shrink-0 bg-slate-200 rounded-lg overflow-hidden">
                            <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0 text-center sm:text-left">
                        <p className="text-sm font-semibold text-slate-900 truncate">
                          {selectedFile.name}
                        </p>
                        <div className="mt-2 inline-flex items-center text-xs text-green-600 bg-green-50 px-2 py-1 rounded-md">
                          <Image size={12} className="mr-1"/> Image loaded
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitDisabled}
              className={`w-full mt-8 py-3.5 px-6 rounded-xl font-bold text-white shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 transition-all transform active:scale-[0.99] ${
                isSubmitDisabled
                  ? 'bg-slate-300 shadow-none cursor-not-allowed opacity-70'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 hover:shadow-xl hover:-translate-y-0.5'
              }`}
            >
              {isLoading ? (
                 <span>{t.analyzingBtn}</span>
              ) : (
                  <>
                      {t.scanBtn} <ArrowRight size={18} />
                  </>
              )}
            </button>
            {/* Button Helper */}
            {isSubmitDisabled && !isLoading && (
                 <p className="text-xs text-center text-slate-400 mt-3 animate-fade-in px-4">
                    {t.helpers?.button}
                 </p>
            )}
          </form>
        )}
      </div>
    </div>
  );
};