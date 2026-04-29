"use client";
import { useState } from "react";

export default function Chat() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const ask = async () => {
    if (!question.trim()) return;
    setIsLoading(true);
    setAnswer(""); // Clear previous answer

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question })
      });
      const data = await res.json();
      setAnswer(data.answer);
    } catch (error) {
      console.error("Error asking question:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 p-6 bg-white/5 border border-white/10 rounded-xl">
      <h2 className="text-lg font-semibold">Step 2: Query Documents</h2>
      <div className="flex gap-2">
        <input 
          value={question} 
          onChange={e => setQuestion(e.target.value)}
          placeholder="Ask a question about your files..."
          onKeyDown={(e) => e.key === 'Enter' && ask()}
          className="flex-1 px-4 py-2 bg-black border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button 
          onClick={ask} 
          disabled={isLoading}
          className="px-6 py-2 bg-white text-black font-bold rounded-lg hover:bg-gray-200 disabled:opacity-50 transition"
        >
          {isLoading ? "Thinking..." : "Ask"}
        </button>
      </div>

      {answer && (
        <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <p className="text-sm text-blue-300 font-bold mb-1">AI Response:</p>
          <p className="text-gray-200 leading-relaxed">{answer}</p>
        </div>
      )}
    </div>
  );
}