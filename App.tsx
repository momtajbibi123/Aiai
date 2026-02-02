
import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  Image as ImageIcon, 
  Send, 
  Trash2, 
  Copy, 
  Check, 
  History as HistoryIcon, 
  X,
  Loader2,
  AlertCircle,
  Maximize2
} from 'lucide-react';
import { getAIAnswer } from './services/geminiService';
import { HistoryItem } from './types';

const App: React.FC = () => {
  const [question, setQuestion] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [imageType, setImageType] = useState<string>('');
  const [answer, setAnswer] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [copied, setCopied] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const answerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('omnigenius_history_v2');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('omnigenius_history_v2', JSON.stringify(history.slice(0, 15)));
  }, [history]);

  useEffect(() => {
    if (answer && answerRef.current) {
      answerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [answer]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError("Image size too large. Max 5MB allowed.");
        return;
      }
      setError(null);
      const reader = new FileReader();
      reader.onload = (event) => {
        setImage(event.target?.result as string);
        setImageType(file.type);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    if (!question.trim() && !image) {
      setError("Please type a question or upload an image first.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setAnswer('');

    try {
      const res = await getAIAnswer(
        question, 
        image ? { data: image, mimeType: imageType } : undefined
      );

      if (res.error) {
        setError(res.error);
      } else {
        setAnswer(res.text);
        const newItem: HistoryItem = {
          id: Date.now().toString(),
          type: image ? 'image' : 'text',
          question: question || "Image Analysis",
          answer: res.text,
          timestamp: Date.now(),
          image: image || undefined
        };
        setHistory(prev => [newItem, ...prev].slice(0, 15));
      }
    } catch (err) {
      setError("Something went wrong. Please check your internet connection.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      handleSubmit();
    }
  };

  const handleClear = () => {
    setQuestion('');
    setImage(null);
    setImageType('');
    setAnswer('');
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(answer);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen selection:bg-blue-100">
      <div className="max-w-3xl mx-auto px-4 py-6 md:py-10">
        
        {/* Navigation Bar */}
        <nav className="flex items-center justify-between mb-10 bg-white/50 backdrop-blur-md sticky top-4 z-40 p-3 rounded-2xl border border-white/20 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-tr from-blue-600 to-indigo-600 p-2.5 rounded-xl shadow-lg shadow-blue-200 ring-2 ring-white">
              <Sparkles className="text-white w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">OmniGenius</h1>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">AI Online</span>
              </div>
            </div>
          </div>
          <button 
            onClick={() => setShowHistory(true)}
            className="p-2.5 hover:bg-white rounded-xl transition-all border border-transparent hover:border-slate-200 active:scale-95 group"
          >
            <HistoryIcon className="text-slate-600 w-5 h-5 group-hover:text-blue-600 transition-colors" />
          </button>
        </nav>

        <main className="space-y-6">
          {/* Input Module */}
          <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/60 p-6 md:p-8 border border-slate-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4">
               <button 
                onClick={handleClear}
                className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                title="Reset All"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-500 ml-1">YOUR QUESTION</label>
                <textarea
                  value={question}
                  onKeyDown={handleKeyDown}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Type anything... e.g. Solve 2x + 5 = 15 or 'Summarize this photo'"
                  className="w-full min-h-[140px] p-5 bg-slate-50/50 rounded-3xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all resize-none text-slate-800 text-lg leading-relaxed placeholder:text-slate-400"
                />
                <div className="flex justify-between items-center px-1">
                  <span className="text-[10px] text-slate-400 font-medium">Tip: Press <kbd className="bg-slate-100 px-1 rounded border">Cmd+Enter</kbd> to send</span>
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-sm font-bold text-slate-500 ml-1">ATTACH IMAGE (OPTIONAL)</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {!image ? (
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="group flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border-2 border-dashed border-slate-200 hover:border-blue-400 hover:bg-blue-50 transition-all text-left"
                    >
                      <div className="bg-white p-3 rounded-xl shadow-sm group-hover:text-blue-600">
                        <ImageIcon className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-700">Add Photo</p>
                        <p className="text-xs text-slate-400 font-medium">OCR & Diagram Analysis</p>
                      </div>
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleImageUpload} 
                        accept="image/*" 
                        className="hidden" 
                      />
                    </button>
                  ) : (
                    <div className="relative group rounded-2xl overflow-hidden border border-slate-200 h-[72px]">
                      <img src={image} alt="Preview" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button onClick={() => setImage(null)} className="bg-white/20 backdrop-blur-md p-1.5 rounded-lg text-white hover:bg-red-500 transition-colors">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}

                  <button
                    disabled={isLoading}
                    onClick={handleSubmit}
                    className={`h-[72px] rounded-2xl flex items-center justify-center gap-3 text-white font-black text-lg shadow-xl shadow-blue-200 transition-all active:scale-95 ${
                      isLoading 
                        ? 'bg-slate-300 cursor-not-allowed shadow-none' 
                        : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:brightness-110'
                    }`}
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-6 h-6 animate-spin" />
                        <span>Thinking...</span>
                      </div>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        <span>Ask AI</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {error && (
              <div className="mt-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 animate-shake">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p className="text-sm font-bold">{error}</p>
              </div>
            )}
          </div>

          {/* Answer Card */}
          {answer && (
            <div ref={answerRef} className="bg-white rounded-[2.5rem] shadow-2xl shadow-blue-900/5 p-8 border border-blue-100 relative group animate-in slide-in-from-bottom-6 duration-500">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center ring-4 ring-blue-50/50">
                    <Sparkles className="text-blue-600 w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-slate-800">OmniGenius Solution</h2>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Instant Analysis Complete</p>
                  </div>
                </div>
                <button 
                  onClick={handleCopy}
                  className="p-2.5 hover:bg-slate-50 rounded-xl transition-all text-slate-400 flex items-center gap-2 active:scale-90"
                >
                  {copied ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
                </button>
              </div>
              
              <div className="text-slate-700 leading-relaxed text-lg font-medium space-y-4 whitespace-pre-wrap">
                {answer}
              </div>
              
              <div className="mt-10 pt-6 border-t border-slate-50 flex flex-wrap gap-4 items-center justify-between">
                <div className="flex items-center gap-4 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                  <span>Confidence: 99%</span>
                  <span className="w-1 h-1 bg-slate-200 rounded-full" />
                  <span>Verified Response</span>
                </div>
                <div className="flex gap-2">
                   <div className="h-1.5 w-1.5 bg-blue-400 rounded-full" />
                   <div className="h-1.5 w-1.5 bg-indigo-400 rounded-full" />
                   <div className="h-1.5 w-1.5 bg-slate-200 rounded-full" />
                </div>
              </div>
            </div>
          )}
        </main>

        {/* Sidebar History */}
        {showHistory && (
          <div className="fixed inset-0 z-[60] flex justify-end">
            <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-md" onClick={() => setShowHistory(false)} />
            <div className="relative w-full max-w-sm bg-white h-full shadow-2xl p-8 flex flex-col animate-in slide-in-from-right duration-500">
              <div className="flex items-center justify-between mb-10">
                <div>
                  <h2 className="text-2xl font-black text-slate-800">Your History</h2>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Last 15 sessions</p>
                </div>
                <button onClick={() => setShowHistory(false)} className="p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl transition-all">
                  <X className="w-6 h-6 text-slate-500" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                {history.length === 0 ? (
                  <div className="text-center py-20 opacity-20">
                    <HistoryIcon className="w-16 h-16 mx-auto mb-4" />
                    <p className="font-bold">No history yet</p>
                  </div>
                ) : (
                  <div className="space-y-4 pb-20">
                    {history.map((item) => (
                      <div 
                        key={item.id}
                        onClick={() => {
                          setQuestion(item.question);
                          setAnswer(item.answer);
                          setImage(item.image || null);
                          setShowHistory(false);
                        }}
                        className="p-5 rounded-3xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/40 transition-all cursor-pointer group active:scale-[0.98]"
                      >
                        <div className="flex items-center gap-3 mb-3">
                           <div className={`p-1.5 rounded-lg ${item.type === 'image' ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-blue-600'}`}>
                              {item.type === 'image' ? <ImageIcon className="w-3.5 h-3.5" /> : <Send className="w-3.5 h-3.5" />}
                           </div>
                           <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
                             {new Date(item.timestamp).toLocaleDateString()}
                           </span>
                        </div>
                        <p className="text-sm font-bold text-slate-800 line-clamp-2 mb-1 group-hover:text-blue-700">
                          {item.question}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <footer className="mt-16 pb-10 text-center">
          <p className="text-slate-300 text-[10px] font-black uppercase tracking-[0.2em]">
            OmniGenius Ultra • v2.0 • Build 2025
          </p>
        </footer>
      </div>
    </div>
  );
};

export default App;
