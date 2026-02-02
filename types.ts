
export interface HistoryItem {
  id: string;
  type: 'text' | 'image';
  question: string;
  answer: string;
  timestamp: number;
  image?: string;
}

export interface GeminiResponse {
  text: string;
  error?: string;
}
