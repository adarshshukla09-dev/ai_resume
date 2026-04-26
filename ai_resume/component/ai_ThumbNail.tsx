"use client";
import { useState } from "react";
import { generateThumbnail } from "@/lib/ai.service/nanoBanana.service";
import { getAvailableThemes } from "@/lib/ai.service/openrouter.service";
import type { PromptEnhancementOptions } from "@/lib/ai.service/openrouter.service";

export function ThumbnailGeneratorAdvanced() {
  const [prompt, setPrompt] = useState("");
  const [colorTheme, setColorTheme] = useState("vibrant");
  const [typography, setTypography] = useState("bold-sans");
  const [aesthetic, setAesthetic] = useState("cinematic");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const themes = getAvailableThemes();

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const options: PromptEnhancementOptions = {
        colorTheme: colorTheme as any,
        typography: typography as any,
        aesthetic: aesthetic as any,
      };

      const result = await generateThumbnail(prompt, options);
      setResult(result);
    } catch (error) {
      console.error("Failed to generate thumbnail:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Input */}
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Describe your thumbnail..."
        className="w-full p-4 border rounded-lg"
      />

      {/* Theme Selectors */}
      <div className="grid grid-cols-3 gap-4">
        <select 
          value={colorTheme} 
          onChange={(e) => setColorTheme(e.target.value)}
          className="p-2 border rounded"
        >
          <option value="" disabled>Color Theme</option>
          {themes.colorThemes.map((theme) => (
            <option key={theme} value={theme}>{theme}</option>
          ))}
        </select>

        <select 
          value={typography} 
          onChange={(e) => setTypography(e.target.value)}
          className="p-2 border rounded"
        >
          <option value="" disabled>Typography</option>
          {themes.typographyStyles.map((style) => (
            <option key={style} value={style}>{style}</option>
          ))}
        </select>

        <select 
          value={aesthetic} 
          onChange={(e) => setAesthetic(e.target.value)}
          className="p-2 border rounded"
        >
          <option value="" disabled>Aesthetic</option>
          {themes.aesthetics.map((aes) => (
            <option key={aes} value={aes}>{aes}</option>
          ))}
        </select>
      </div>

      {/* Generate Button */}
      <button
        onClick={handleGenerate}
        disabled={loading}
        className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
      >
        {loading ? "Generating..." : "Generate Thumbnail"}
      </button>

      {/* Results */}
      {result && (
        <div className="space-y-4 p-4 bg-gray-100 rounded-lg">
          <img src={result.imageUrl} alt="Generated" className="w-full rounded" />
          <div>
            <h3 className="font-bold mb-2">Enhanced Prompt:</h3>
            <p className="text-sm text-gray-700">{result.revisedPrompt}</p>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div><strong>Color Theme:</strong> {result.colorTheme}</div>
            <div><strong>Typography:</strong> {result.typography}</div>
          </div>
        </div>
      )}
    </div>
  );
}