"use client";
import { useState, useRef, useEffect } from "react";
import { Upload, MessageSquare, Send, Loader2 } from "lucide-react";

export default function RAGInterface() {
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [query, setQuery] = useState("");
  const [chatHistory, setChatHistory] = useState<{ role: string; content: string }[]>([]);
  const [isLoadingAnswer, setIsLoadingAnswer] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // auto scroll
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory, isLoadingAnswer]);

  // ✅ handle multi file select
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files ? Array.from(e.target.files) : [];
    setFiles(selected);
  };

  // ✅ upload multiple files
  const handleUpload = async () => {
    if (files.length === 0) return;
    setIsUploading(true);

    const formData = new FormData();
    files.forEach(f => formData.append("files", f));

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        setChatHistory(prev => [
          ...prev,
          {
            role: "ai",
            content: `✅ ${files.length} file(s) indexed successfully`,
          },
        ]);
        setFiles([]);
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      console.error(err);
      setChatHistory(prev => [
        ...prev,
        { role: "ai", content: "❌ Upload failed" },
      ]);
    } finally {
      setIsUploading(false);
    }
  };

  // ✅ query
  const handleQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isLoadingAnswer) return;

    const userMessage = query;
    setQuery("");
    setChatHistory(prev => [...prev, { role: "user", content: userMessage }]);
    setIsLoadingAnswer(true);

    try {
      const res = await fetch("/api/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: userMessage }),
      });

      const data = await res.json();

      setChatHistory(prev => [
        ...prev,
        { role: "ai", content: data.answer || "No response" },
      ]);
    } catch {
      setChatHistory(prev => [
        ...prev,
        { role: "ai", content: "❌ Error getting answer" },
      ]);
    } finally {
      setIsLoadingAnswer(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8 min-h-screen">
      <header className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Multi-PDF Assistant</h1>
      </header>

      {/* Upload */}
      <section className="border-2 border-dashed rounded-xl p-8 text-center">
        <div onClick={() => fileInputRef.current?.click()} className="cursor-pointer">
          <Upload size={32} />
          <p className="mt-2">
            {files.length > 0
              ? `${files.length} file(s) selected`
              : "Click to select PDFs"}
          </p>
        </div>

        <input
          type="file"
          multiple
          hidden
          ref={fileInputRef}
          accept=".pdf"
          onChange={handleFileChange}
        />

        <button
          disabled={files.length === 0 || isUploading}
          onClick={handleUpload}
          className="mt-4 px-6 py-2 bg-blue-600 text-white rounded"
        >
          {isUploading ? "Uploading..." : "Add to Index"}
        </button>
      </section>

      {/* Chat */}
      <section className="flex flex-col h-96 border rounded-xl overflow-hidden">
        <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-3">
          {chatHistory.map((msg, i) => (
            <div key={i} className={msg.role === "user" ? "text-right" : ""}>
              <div className="inline-block px-4 py-2 rounded bg-gray-100">
                {msg.content}
              </div>
            </div>
          ))}

          {isLoadingAnswer && <p>Thinking...</p>}
        </div>

        <form onSubmit={handleQuery} className="p-2 flex gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 border px-3 py-2 rounded"
          />
          <button className="bg-blue-600 text-white px-4 rounded">
            <Send size={16} />
          </button>
        </form>
      </section>
    </div>
  );
}