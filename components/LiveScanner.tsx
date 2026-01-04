import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { X, Mic, MicOff, Video, Activity, Loader2, Play, AlertCircle } from 'lucide-react';
import { translations } from '../i18n';
import { Language } from '../types';

interface LiveScannerProps {
  onClose: () => void;
  language?: Language;
}

// Audio Utils
function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function createBlob(data: Float32Array): { data: string; mimeType: string } {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  return {
    data: encode(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000',
  };
}

export const LiveScanner: React.FC<LiveScannerProps> = ({ onClose, language = 'en' }) => {
  const t = translations[language].liveScanner;
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [isMicActive, setIsMicActive] = useState(false);

  // Refs for cleanup
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<number | null>(null);
  const sessionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  const startScanner = async () => {
    setConnectionStatus('connecting');
    setError(null);

    try {
        // 1. Setup Audio Output Context (24kHz for Gemini Output)
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        const audioCtx = new AudioContextClass({ sampleRate: 24000 });
        audioContextRef.current = audioCtx;
        if (audioCtx.state === 'suspended') await audioCtx.resume();

        // 2. Setup Audio Input Context (16kHz for Gemini Input)
        const inputAudioCtx = new AudioContextClass({ sampleRate: 16000 });
        inputAudioContextRef.current = inputAudioCtx;

        // 3. Get Media Stream (Video + Audio)
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            facingMode: 'environment',
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }, 
          audio: {
             echoCancellation: true,
             noiseSuppression: true,
             autoGainControl: true,
             sampleRate: 16000
          } 
        });
        streamRef.current = stream;
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        // 4. Connect to Gemini Live
        const API_KEY = (import.meta as any).env?.VITE_API_KEY || process.env.API_KEY;
        if (!API_KEY) throw new Error("Missing API Key.");
        
        const ai = new GoogleGenAI({ apiKey: API_KEY });
        
        const sessionPromise = ai.live.connect({
          model: 'gemini-2.5-flash-native-audio-preview-09-2025',
          callbacks: {
            onopen: () => {
              setConnectionStatus('connected');
              
              // Start Video Stream (1 FPS)
              startFrameCapture(sessionPromise);
              
              // Start Audio Stream (Microphone)
              startAudioCapture(stream, inputAudioCtx, sessionPromise);
              setIsMicActive(true);
            },
            onmessage: async (message: LiveServerMessage) => {
              // Handle Audio Response
              const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
              
              if (base64Audio && audioCtx) {
                setIsAiSpeaking(true);
                nextStartTimeRef.current = Math.max(nextStartTimeRef.current, audioCtx.currentTime);
                
                const audioBuffer = await decodeAudioData(decode(base64Audio), audioCtx, 24000, 1);
                const source = audioCtx.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(audioCtx.destination);
                
                source.addEventListener('ended', () => {
                  sourcesRef.current.delete(source);
                  if (sourcesRef.current.size === 0) setIsAiSpeaking(false);
                });

                source.start(nextStartTimeRef.current);
                nextStartTimeRef.current += audioBuffer.duration;
                sourcesRef.current.add(source);
              }

              if (message.serverContent?.interrupted) {
                sourcesRef.current.forEach(s => s.stop());
                sourcesRef.current.clear();
                nextStartTimeRef.current = 0;
                setIsAiSpeaking(false);
              }
            },
            onclose: () => console.log("Live session closed"),
            onerror: (err) => {
              console.error("Live error", err);
              setConnectionStatus('error');
              setError("Connection interrupted. Please check your internet.");
            }
          },
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
              voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } // 'Kore' is professional/authoritative
            },
            systemInstruction: `You are 'ScamShield', a helpful **AI Safety Assistant** for India.
            
            **Mission**: Help users identify potential financial fraud triggers in real-time visuals and audio.
            
            **Rules**:
            1. **Be Concise**: Speak short, clear sentences.
            2. **Visual Triggers**:
               - QR Codes: Warn "Be careful. Do NOT scan to receive money."
               - Letters: Look for fake logos or typos (CBI, RBI).
               - ATMs: Look for loose parts or skimmers.
            3. **Audio Triggers**:
               - "Digital Arrest" / "Police": Warn "Police do not arrest via video call."
               - "OTP" / "Refund": Warn "Do not share OTP with anyone."
            
            **Tone**: Helpful, alert, and calm. Avoid acting like law enforcement. If safe, say "Looks okay, but stay alert."`,
          }
        });

        sessionRef.current = sessionPromise;

      } catch (err: any) {
        console.error("Scanner init error:", err);
        setConnectionStatus('error');
        
        let msg = "An unexpected error occurred.";
        
        // Browser Media API Errors
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
            msg = "Access Denied. Please grant camera and microphone access in your browser settings.";
        } else if (err.name === 'NotFoundError') {
             msg = "No camera or microphone found on this device.";
        } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
             msg = "Camera or microphone is currently in use by another app.";
        } else if (err.message?.includes('API Key')) {
            msg = "Service configuration error (API Key).";
        } else {
            // General fallback usually implies network or unknown
             msg = "Failed to connect. Please check your internet connection and try again.";
        }
        
        setError(msg);
      }
  };

  const startAudioCapture = (stream: MediaStream, audioCtx: AudioContext, sessionPromise: Promise<any>) => {
      const source = audioCtx.createMediaStreamSource(stream);
      // Reduce buffer size to 2048 (approx 128ms) for lower latency responsiveness
      const scriptProcessor = audioCtx.createScriptProcessor(2048, 1, 1);
      scriptProcessorRef.current = scriptProcessor;

      scriptProcessor.onaudioprocess = (e) => {
          const inputData = e.inputBuffer.getChannelData(0);
          const pcmData = createBlob(inputData);
          
          sessionPromise.then(session => {
              session.sendRealtimeInput({ media: pcmData });
          });
      };

      source.connect(scriptProcessor);
      scriptProcessor.connect(audioCtx.destination);
  };

  const startFrameCapture = (sessionPromise: Promise<any>) => {
    // Send frames slightly faster (1.5s interval) to capture changing context without overwhelming bandwidth
    intervalRef.current = window.setInterval(async () => {
      if (!canvasRef.current || !videoRef.current) return;
      const ctx = canvasRef.current.getContext('2d');
      if (!ctx) return;

      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
      ctx.drawImage(videoRef.current, 0, 0);

      canvasRef.current.toBlob(async (blob) => {
        if (blob) {
          const base64Data = await blobToBase64(blob);
          sessionPromise.then(session => {
             session.sendRealtimeInput({
                media: { data: base64Data, mimeType: 'image/jpeg' }
             });
          });
        }
      }, 'image/jpeg', 0.5); 
    }, 1500);
  };

  const stopSession = () => {
    if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (audioContextRef.current) audioContextRef.current.close();
    if (inputAudioContextRef.current) inputAudioContextRef.current.close();
    if (scriptProcessorRef.current) scriptProcessorRef.current.disconnect();
  };

  useEffect(() => {
    // We don't auto-start here to allow user gesture for AudioContext
    return () => stopSession();
  }, []);

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center">
      {/* Header Overlay */}
      <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-start z-10 bg-gradient-to-b from-black/80 to-transparent">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-red-600 rounded-full animate-pulse">
            <Video className="text-white" size={20} />
          </div>
          <div>
            <h2 className="text-white font-bold text-lg">{t.title}</h2>
            <p className="text-white/70 text-xs">{t.subtitle}</p>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="p-3 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white/20 transition-all"
        >
          <X size={24} />
        </button>
      </div>

      {/* Main Video Feed */}
      <div className="relative w-full h-full flex items-center justify-center bg-slate-900">
        <video 
          ref={videoRef}
          className="w-full h-full object-cover"
          muted
          playsInline
          autoPlay
        />
        <canvas ref={canvasRef} className="hidden" />
        
        {/* Status Indicators */}
        {connectionStatus === 'connected' && (
            <div className="absolute inset-x-0 bottom-32 flex justify-center gap-4">
                 {/* Mic Status */}
                 <div className={`px-4 py-2 rounded-full backdrop-blur-md border flex items-center gap-2 transition-all ${
                     isMicActive ? 'bg-black/40 border-green-500/50 text-white' : 'bg-black/60 border-white/10 text-white/50'
                 }`}>
                     {isMicActive ? <Mic size={16} className="text-green-400" /> : <MicOff size={16} />}
                     <span className="text-xs font-bold uppercase">{isMicActive ? t.micOn : t.micOff}</span>
                 </div>

                 {/* AI Status */}
                 <div className={`px-6 py-2 rounded-full backdrop-blur-md border flex items-center gap-2 transition-all ${
                     isAiSpeaking 
                     ? 'bg-orange-600/90 border-orange-400 text-white shadow-lg shadow-orange-500/30 scale-110' 
                     : 'bg-black/40 border-white/10 text-white/80'
                 }`}>
                     {isAiSpeaking ? <Activity size={16} className="animate-pulse" /> : <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>}
                     <span className="text-sm font-bold">{isAiSpeaking ? t.aiSpeaking : t.aiWatching}</span>
                 </div>
            </div>
        )}

        {/* Start Button */}
        {connectionStatus === 'idle' && (
             <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-20">
                <button 
                    onClick={startScanner}
                    className="flex flex-col items-center gap-4 group"
                >
                    <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center group-hover:scale-110 transition-transform shadow-[0_0_40px_rgba(255,255,255,0.3)]">
                        <Play size={48} className="text-blue-600 ml-2" />
                    </div>
                    <span className="text-white font-bold text-2xl">{t.startBtn}</span>
                    <p className="text-white/60 text-sm">{t.reqPermission}</p>
                </button>
             </div>
        )}

        {/* Loading */}
        {connectionStatus === 'connecting' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-20">
            <Loader2 className="text-orange-500 animate-spin mb-4" size={48} />
            <p className="text-white font-medium">{t.connecting}</p>
          </div>
        )}

        {/* Error */}
        {connectionStatus === 'error' && (
           <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 z-20 px-6 text-center">
              <div className="p-4 bg-red-500/20 rounded-full mb-4 text-red-500 animate-pulse">
                  <AlertCircle size={32} />
              </div>
              <h3 className="text-white text-xl font-bold mb-2">{t.connectionIssue}</h3>
              <p className="text-white/80 mb-6 max-w-xs mx-auto text-sm leading-relaxed">{error}</p>
              <div className="flex gap-4">
                  <button onClick={startScanner} className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-full transition-colors">{t.retry}</button>
                  <button onClick={onClose} className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-full transition-colors">{t.close}</button>
              </div>
           </div>
        )}
      </div>
    </div>
  );
};