import { GoogleGenAI, Type, Modality } from "@google/genai";
import { AnalysisResult, AnalysisType, ScamContext, RegionalAlert, Language } from '../types';

// Robust API Key retrieval for Vercel/Vite environments
const API_KEY = (import.meta as any).env?.VITE_API_KEY || process.env.API_KEY;

if (!API_KEY) {
  console.error("CRITICAL: API Key is missing. Please set VITE_API_KEY in your Vercel Environment Variables.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

// PCM Decoder Helper (Same as in LiveScanner)
function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Manual PCM to AudioBuffer decoder
function pcmToAudioBuffer(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number = 24000,
  numChannels: number = 1,
): AudioBuffer {
  const dataInt16 = new Int16Array(data.buffer, data.byteOffset, data.byteLength / 2);
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

// Helper to convert File to base64
const fileToGenerativePart = async (file: File | Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      const base64Data = base64String.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const getLanguageName = (code: Language) => {
    if (code === 'hi') return 'Hindi';
    if (code === 'or') return 'Odia';
    return 'English';
}

/**
 * Generates dynamic Scam Dojo questions.
 */
export interface DojoScenario {
    id: string;
    text: string;
    sender: string;
    isScam: boolean;
    reason: string;
    difficulty: 'Easy' | 'Hard';
}

export const getScamDojoQuestions = async (language: Language): Promise<DojoScenario[]> => {
    const modelName = 'gemini-3-flash-preview';
    const langName = getLanguageName(language);
    
    // Mix of scenarios to ensure variety every time
    const prompt = `
    Generate 5 UNIQUE and REALISTIC scam/safe message scenarios for an Indian user in ${langName}.
    
    Requirements:
    1. **Mix**: 3 Scams, 2 Safe messages.
    2. **Context**: Use Indian contexts (UPI, HDFC/SBI/ICICI, Electricity Board, Jio/Airtel, WhatsApp "Digital Arrest").
    3. **Scam Examples**: 
       - "Your electricity will be cut at 9:30 PM"
       - "CBI: Arrest warrant issued against you"
       - "Part-time job: Earn 5000/day"
       - "Credit Card points expiring"
    4. **Safe Examples**:
       - Genuine OTP message (e.g. "Your OTP is 123456. Do not share.")
       - Transaction alert (e.g. "Rs 500 debited via UPI")
       - Service update (e.g. "Your recharge was successful")
    5. **Difficulty**: Make some tricky (e.g. a safe message that looks slightly scary but is actually genuine, or a scam that looks very professional).

    **Output Rules for 'reason'**:
    - Do NOT simply say "It is a scam."
    - Explain the **manipulation technique** (e.g., "This uses false urgency to make you panic.")
    - Tell the user **what to check** (e.g., "Check the sender ID; banks don't use personal numbers.")
    - Keep it educational and supportive.

    Output JSON Array format:
    [
      {
        "id": "1",
        "sender": "Sender Name or Number (e.g. +91 98..., AD-HDFCBK)",
        "text": "The message body...",
        "isScam": boolean,
        "reason": "Short educational explanation in ${langName}.",
        "difficulty": "Easy" | "Hard"
      }
    ]
    `;

    try {
        const response = await ai.models.generateContent({
            model: modelName,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            id: { type: Type.STRING },
                            sender: { type: Type.STRING },
                            text: { type: Type.STRING },
                            isScam: { type: Type.BOOLEAN },
                            reason: { type: Type.STRING },
                            difficulty: { type: Type.STRING, enum: ["Easy", "Hard"] }
                        }
                    }
                }
            }
        });

        const text = response.text;
        if (!text) throw new Error("No scenarios generated.");
        return JSON.parse(text) as DojoScenario[];

    } catch (e) {
        console.error("Dojo Gen Error:", e);
        // Fallback if AI fails
        return [
            { id: '1', sender: '+91 98765xxxxx', text: 'Dear customer, your electricity will be disconnected tonight. Call 99xxx immediately.', isScam: true, reason: 'Personal numbers are not used for official utility warnings. This creates false urgency.', difficulty: 'Easy' },
            { id: '2', sender: 'AX-HDFCBK', text: 'Rs 5,000 debited from a/c **1234 to UPI-Zomato. Bal: 12,000.', isScam: false, reason: 'This uses a correct Sender ID and does not ask you to click a link.', difficulty: 'Easy' },
        ];
    }
};

/**
 * Transcribes audio blob to text using Gemini.
 */
export const transcribeAudio = async (audioBlob: Blob): Promise<string> => {
    const modelName = 'gemini-3-flash-preview';
    
    try {
        const base64Data = await fileToGenerativePart(audioBlob);
        
        const response = await ai.models.generateContent({
            model: modelName,
            contents: {
                parts: [
                    {
                        inlineData: {
                            mimeType: audioBlob.type || 'audio/webm',
                            data: base64Data
                        }
                    },
                    { text: "Transcribe the spoken audio exactly. Return only the transcription text." }
                ]
            }
        });

        const text = response.text;
        if (!text) throw new Error("No transcription returned from Gemini.");
        return text.trim();
    } catch (error) {
        console.error("Transcription Error:", error);
        throw new Error("Failed to transcribe audio.");
    }
};

export const analyzeContent = async (
  content: string | File, 
  type: AnalysisType,
  context: ScamContext,
  language: Language
): Promise<AnalysisResult> => {

  const modelName = 'gemini-3-flash-preview'; 
  const langName = getLanguageName(language);

  // Enhanced System Instruction for better accuracy
  const SYSTEM_INSTRUCTION = `
    You are a specialized **AI Safety Assistant** for Indian users.
    Your goal is to help users **assess the risk** of content (text, images, URLs) related to digital finance and communication.
    You do NOT provide legal judgments or guaranteed protection. You provide **risk assessments** and **educational advice**.

    **Differentiation Logic (Safe vs. Suspicious vs. High Risk):**

    1. **Safe (Score 0-20):**
       - **Source:** Verified Sender IDs (e.g., AD-HDFCBK, JM-SBIINB) or known contacts.
       - **Content:** Transaction alerts (money debited/credited), requested OTPs, account statements.
       - **Tone:** Informational, neutral. No urgency to click links immediately.

    2. **Suspicious (Score 21-50):**
       - **Source:** Unknown personal numbers (+91 98...) sending marketing or vague messages.
       - **Content:** "You won a lottery", "Job offer w/o interview", "Click to claim gift", generic promotional spam.
       - **Tone:** Exciting, promotional, slightly urgent but not threatening.
       - **Link:** Generic short links (bit.ly) but not mimicking banking URLs.

    3. **High Risk / Scam (Score 51-100):**
       - **Source:** Personal number posing as "Bank Manager", "Police", "Electricity Officer".
       - **Content:**
         - **"Digital Arrest"**: Threats of CBI/Narco/Customs seizing package or arresting user via video call. (Score: 90-100)
         - **UPI Fraud**: "Scan QR code to RECEIVE money", "Enter PIN to verify refund". (Score: 90-100)
         - **KYC/PAN Blocking**: "Update PAN now or account blocked tonight", "SIM deactivation warning". (Score: 80-95)
         - **Electricity Cut**: "Bill unpaid, power cut at 9:30 PM". (Score: 80-95)
         - **APK Files**: Links ending in .apk or asking to install AnyDesk/TeamViewer/QuickSupport. (Score: 95-100)
         - **Sextortion**: Threats to leak video/photos. (Score: 95-100)
       - **Tone:** Threatening, false urgency ("Immediately", "Within 24 hours"), authoritative.
       - **Link:** Look-alike domains (e.g., sbi-kyc-update.com, hdfc-netbanking.org).

    **Critical Indian Context Rules:**
    - **Banks/Govt never ask for OTP/PIN over call/WhatsApp.**
    - **Banks never threaten immediate account blocking via SMS/WhatsApp.**
    - **Police/CBI never conduct interrogations via Skype/WhatsApp video calls.**
    - **PIN is ONLY for sending money, never for receiving.**

    **Output Rules:**
    - **Language**: Provide 'advice' and 'triggers' in **${langName}**.
    - **Triggers**: Be specific (e.g., "Personal number used for official claim", "Threat of disconnection", "Request for PIN to receive money").
    - **Advice**: Frame as suggestions. Use phrases like "Consider verifying...", "It is risky to...", "We recommend...". Do not use authoritative commands like "Arrest them".
    - **Risk Score**: Provide a score from 0 to 100 based on the differentiation logic.

    You must return a strictly valid JSON object.
    `;

  let promptContent: any;
  const contextString = `Context: ${context.replace('_', ' ').toUpperCase()}`;

  if (type === 'text') {
    promptContent = `${contextString}. Analyze this text for Indian context scam potential: "${content as string}"`;
  } else if (type === 'url') {
    promptContent = `Analyze this URL for phishing/scam potential: "${content as string}". Check against known banking URL patterns in India.`;
  } else {
    const base64Data = await fileToGenerativePart(content as File);
    promptContent = {
      parts: [
        {
            inlineData: {
                mimeType: (content as File).type,
                data: base64Data
            }
        },
        { text: `${contextString}. Analyze this image for scam potential in India.` }
      ]
    };
  }

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: promptContent,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            is_scam: { type: Type.BOOLEAN },
            risk_score: { type: Type.INTEGER },
            scam_type: { type: Type.STRING },
            advice: { type: Type.STRING, description: `The advice in ${langName}` },
            triggers: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: `List of triggers in ${langName}`
            }
          },
          required: ["is_scam", "risk_score", "scam_type", "advice", "triggers"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini.");

    const result = JSON.parse(text) as AnalysisResult;
    result.language = language; // Attach requested language
    return result;

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Failed to analyze content. Please try again.");
  }
};

/**
 * Generates audio for the provided text using Gemini TTS.
 * This is used for "Voice Warning" and reading advice.
 */
export const generateScamAudio = async (text: string, language: Language): Promise<AudioBuffer> => {
    const modelName = 'gemini-2.5-flash-preview-tts';
    
    // 1. Strip markdown characters that confuse TTS (**, *, _, #)
    // 2. Limit length to avoid timeouts/limits (approx 400 chars)
    let cleanText = text.replace(/[*_#`]/g, '').trim();
    if (cleanText.length > 400) {
        cleanText = cleanText.substring(0, 397) + "...";
    }

    if (!cleanText) throw new Error("Text is empty, cannot generate audio.");

    // Choose a voice.
    const voiceName = 'Puck'; 
    
    try {
        // We wrap the text in a simple instruction to ensure the model treats it as content to speak
        const prompt = `Say the following message clearly: ${cleanText}`;

        const response = await ai.models.generateContent({
            model: modelName,
            contents: [{ parts: [{ text: prompt }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: voiceName },
                    },
                },
            },
        });

        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        
        // Check for empty audio which causes "OTHER" finishReason
        if (!base64Audio) {
            console.warn("Gemini TTS returned no audio. finishReason:", response.candidates?.[0]?.finishReason);
            throw new Error("TTS generation failed.");
        }

        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        
        // Decode raw PCM manually
        const audioBuffer = pcmToAudioBuffer(decode(base64Audio), audioCtx, 24000, 1);
        
        return audioBuffer;
    } catch (e) {
        console.error("Audio generation failed:", e);
        throw e;
    }
};

export const getRegionalScamAlerts = async (latitude: number, longitude: number): Promise<RegionalAlert> => {
    // We use gemini-3-flash-preview for fast search grounding
    const modelName = 'gemini-3-flash-preview';
    
    // Prompt to use Search Grounding
    const prompt = `
    1. Identify the specific City and State in India for the coordinates: ${latitude}, ${longitude}.
    2. Using Google Search, find the latest news, police warnings, and cybercrime alerts specifically for this city/region from the last 3-6 months.
    3. Look for terms like "Digital Arrest", "Electricity Bill Scam", "FedEx Scam", "Part-time job scam", "Cyber police warning".
    4. Summarize the **actual** found trends into the JSON format.
    5. For 'topScams', estimate a 'count' based on the intensity of news reports (e.g. widely reported = high count).
    6. For 'recentIncidents', summarize 2-3 specific real news headlines found.
    `;

    try {
        const response = await ai.models.generateContent({
            model: modelName,
            contents: prompt,
            config: {
                tools: [{googleSearch: {}}], // Enable Live Search
                systemInstruction: `You are a real-time Scam Intelligence Analyst. 
                You must ALWAYS use Google Search to find real, recent data. 
                Do not hallucinate incidents. If no specific local news is found, fallback to state-level or national trends but clearly mention the location scope.`,
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        location: { type: Type.STRING, description: "The identified City and State." },
                        riskLevel: { type: Type.STRING, enum: ['Low', 'Medium', 'High', 'Critical'] },
                        topScams: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    title: { type: Type.STRING },
                                    count: { type: Type.INTEGER, description: "Estimated intensity/reports" }
                                }
                            }
                        },
                        recentIncidents: { type: Type.ARRAY, items: { type: Type.STRING } },
                        safetyTip: { type: Type.STRING }
                    }
                }
            }
        });

        const text = response.text;
        if(!text) throw new Error("No intelligence data received.");
        
        const data = JSON.parse(text) as RegionalAlert;
        
        // Extract Grounding Metadata (Source Links)
        const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
        const sources = chunks
            .map((chunk: any) => chunk.web)
            .filter((web: any) => web)
            .map((web: any) => ({ title: web.title, uri: web.uri }));
            
        data.sources = sources;

        return data;

    } catch (error) {
        console.error("Intelligence Engine Error:", error);
        // Fallback data if search fails
        return {
            location: "India (Connection Error)",
            riskLevel: "High",
            topScams: [{ title: "UPI Fraud", count: 0 }, { title: "Digital Arrest", count: 0 }],
            recentIncidents: ["Could not fetch live news. Please check internet connection."],
            safetyTip: "Always verify caller identity before transferring money."
        };
    }
}