"use client";
import { useState, useRef } from "react";

export default function Upload() {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async () => {
    const files = fileInputRef.current?.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const formData = new FormData();
    Array.from(files).forEach(f => formData.append("files", f));

    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (res.ok) {
        alert("Documents indexed successfully!");
        if (fileInputRef.current) fileInputRef.current.value = ""; 
      }
    } catch (err) {
      console.error("Upload failed", err);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="p-6 bg-white/5 border border-white/10 rounded-xl mb-8">
      <h2 className="text-lg font-semibold mb-4">Step 1: Upload Knowledge</h2>
      <div className="flex items-center gap-4">
        <input 
          type="file" 
          multiple 
          ref={fileInputRef}
          className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
        <button 
          onClick={handleUpload}
          disabled={isUploading}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 rounded-lg font-medium transition"
        >
          {isUploading ? "Processing..." : "Upload"}
        </button>
      </div>
    </div>
  );
}