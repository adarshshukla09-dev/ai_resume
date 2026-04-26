




"use client";

import React, { useState } from "react";

export default function InterviewPage() {
  const [file, setFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState("");
  const [selfDescription, setSelfDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<null | Record<string, any>>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!file || !jobDescription || !selfDescription) {
      return alert("All fields are required");
    }

    setLoading(true);

    const formData = new FormData();
    formData.append("resume", file);
    formData.append("jobDescription", jobDescription);
    formData.append("selfDescription", selfDescription);
    formData.append("userId", "user_123");

    try {
      const res = await fetch("/api/interview", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        setReport(data.data); // ✅ FIXED
      } else {
        alert(data.error || "Something went wrong");
      }
    } catch (error) {
      console.error("Submission error:", error);
      alert("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
 <div className="max-w-4xl mx-auto p-8 text-black">
      <h1 className="text-3xl font-bold mb-6">AI Interview Prep</h1>

      <form
        onSubmit={handleSubmit}
        className="space-y-4 bg-white p-6 rounded-lg shadow-md border"
      >
        <div>
          <label className="block text-sm font-medium mb-1">
            Upload Resume (PDF)
          </label>
          <input
            type="file"
            accept=".pdf"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="w-full p-2 border rounded-md"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Job Description
          </label>
          <textarea
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            className="w-full p-2 border rounded-md h-32"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Self Description
          </label>
          <textarea
            value={selfDescription}
            onChange={(e) => setSelfDescription(e.target.value)}
            className="w-full p-2 border rounded-md h-24"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
        >
          {loading ? "Analyzing with AI..." : "Generate Report"}
        </button>
      </form>

      {report && (
        <div className="mt-10 p-6 bg-gray-50 rounded-lg border">
          <h2 className="text-2xl font-semibold mb-4">
            Your Interview Report
          </h2>
          <pre className="whitespace-pre-wrap text-sm text-gray-700">
            {JSON.stringify(report, null, 2)}
          </pre>
        </div>
      )}
    </div>);
}