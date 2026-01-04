
export type AnalysisType = 'text' | 'image' | 'url';

export type ScamContext = 'sms' | 'email' | 'whatsapp' | 'social_media' | 'dating_app' | 'marketplace' | 'banking' | 'url' | 'other';

export type Language = 'en' | 'hi' | 'or'; // English, Hindi, Odia

export interface AnalysisResult {
  is_scam: boolean;
  risk_score: number; // 0-100
  scam_type: string; // e.g. "Phishing", "Romance Scam", "Investment Fraud"
  advice: string;
  triggers: string[];
  language: Language; // Store language for TTS
}

export interface RegionalAlert {
  location: string;
  riskLevel: 'Low' | 'Medium' | 'High' | 'Critical';
  topScams: { title: string; count: number }[];
  recentIncidents: string[];
  safetyTip: string;
  sources?: { title: string; uri: string }[];
}

export interface ScamReport {
  id: string;
  type: string;
  description: string;
  timestamp: number;
  reporter: string; // "Anonymous User"
}

// Added 'education' and 'simulation' to the union type
export type ViewState = 'home' | 'analyze' | 'radar' | 'education' | 'simulation';
