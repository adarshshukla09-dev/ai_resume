"use client";

import { useState, useRef } from "react";
import { Upload, MessageSquare, Send, FileText, Loader2, CheckCircle2 } from "lucide-react";

export default function RAGInterface() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isUploaded, setIsUploaded] = useState(false);
  const [query, setQuery] = useState("");
  const [chatHistory, setChatHistory] = useState<{ role: string; content: string }[]>([]);
  const [isLoadingAnswer, setIsLoadingAnswer] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. Handle File Upload
  const handleUpload = async () => {
    if (!file) return;
    setIsUploading(true);
    
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (res.ok) {
        setIsUploaded(true);
        setChatHistory([{ role: "ai", content: "PDF indexed! You can now ask questions about it." }]);
      }
    } catch (err) {
      console.error("Upload failed", err);
    } finally {
      setIsUploading(false);
    }
  };

  // 2. Handle Query
  const handleQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isLoadingAnswer) return;

    const userMessage = query;
    setQuery("");
    setChatHistory((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoadingAnswer(true);

    try {
      const res = await fetch("/api/query", {
        method: "POST",
        body: JSON.stringify({ query: userMessage }),
      });
      const data = await res.json();
      setChatHistory((prev) => [...prev, { role: "ai", content: data.answer }]);
    } catch (err) {
      setChatHistory((prev) => [...prev, { role: "ai", content: "Error: Could not get answer." }]);
    } finally {
      setIsLoadingAnswer(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8 min-h-screen">
      <header className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">AI Document Assistant</h1>
        <p className="text-gray-500">Upload a PDF and chat with its content using OpenRouter & Qdrant.</p>
      </header>

      {/* --- Upload Section --- */}
      <section className="bg-white border-2 border-dashed border-gray-200 rounded-xl p-8 transition-colors hover:border-blue-400">
        <div className="flex flex-col items-center justify-center space-y-4">
          {!isUploaded ? (
            <>
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="cursor-pointer bg-blue-50 p-4 rounded-full text-blue-600 hover:bg-blue-100 transition-colors"
              >
                <Upload size={32} />
              </div>
              <input 
                type="file" 
                hidden 
                ref={fileInputRef} 
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                accept=".pdf"
              />
              <div className="text-center">
                <p className="text-sm font-medium">{file ? file.name : "Click to choose PDF"}</p>
                <p className="text-xs text-gray-400">Maximum size 10MB</p>
              </div>
              <button
                disabled={!file || isUploading}
                onClick={handleUpload}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              >
                {isUploading ? <Loader2 className="animate-spin" size={18} /> : "Upload & Index"}
              </button>
            </>
          ) : (
            <div className="flex items-center gap-3 text-green-600 bg-green-50 px-6 py-3 rounded-full">
              <CheckCircle2 size={24} />
              <span className="font-medium">Document successfully indexed!</span>
              <button onClick={() => setIsUploaded(false)} className="text-xs underline ml-4 text-green-700">Change file</button>
            </div>
          )}
        </div>
      </section>

      {/* --- Chat Section --- */}
      <section className="flex flex-col h-[500px] bg-gray-50 rounded-xl overflow-hidden border border-gray-200">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {chatHistory.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-2">
              <MessageSquare size={48} strokeWidth={1} />
              <p>Your conversation will appear here</p>
            </div>
          )}
          {chatHistory.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] px-4 py-2 rounded-2xl ${
                msg.role === 'user' 
                  ? 'bg-blue-600 text-white rounded-tr-none' 
                  : 'bg-white text-gray-800 border border-gray-200 rounded-tl-noneShadow-sm'
              }`}>
                <p className="text-sm">{msg.content}</p>
              </div>
            </div>
          ))}
          {isLoadingAnswer && (
            <div className="flex justify-start">
              <div className="bg-white border border-gray-200 px-4 py-2 rounded-2xl rounded-tl-none animate-pulse flex items-center gap-2">
                <Loader2 size={14} className="animate-spin" />
                <span className="text-xs text-gray-500">AI is thinking...</span>
              </div>
            </div>
          )}
        </div>

        {/* Input area */}
        <form onSubmit={handleQuery} className="p-4 bg-white border-t border-gray-200 flex gap-2">
          <input
            type="text"
            placeholder={isUploaded ? "Ask a question..." : "Please upload a PDF first"}
            disabled={!isUploaded}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-gray-100 border-none rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          />
          <button
            type="submit"
            disabled={!isUploaded || !query.trim()}
            className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            <Send size={18} />
          </button>
        </form>
      </section>
    </div>
  );
}