import "dotenv/config";
import OpenAI from "openai";
const apiKey = process.env.OPENROUTER_API_KEY;

if (!apiKey) {
  console.warn("Missing OPENROUTER_API_KEY. AI features will not work.");
}


// Type definitions
type ColorTheme = 
  | "vibrant" 
  | "dark-moody" 
  | "pastel" 
  | "neon" 
  | "natural" 
  | "monochrome" 
  | "gradient" 
  | "high-contrast";

type TypographyStyle = 
  | "bold-sans" 
  | "elegant-serif" 
  | "modern-geometric" 
  | "handwritten" 
  | "retro" 
  | "minimal" 
  | "graffiti";

type Aesthetic = 
  | "cinematic" 
  | "minimalist" 
  | "maximalist" 
  | "retro-futuristic" 
  | "luxury" 
  | "playful" 
  | "editorial" 
  | "brutalist";

type Lighting = 
  | "dramatic-rim" 
  | "studio-professional" 
  | "moody-low-key" 
  | "natural-soft" 
  | "neon-glow" 
  | "volumetric";

export interface PromptEnhancementOptions {
  colorTheme?: ColorTheme;
  typography?: TypographyStyle;
  aesthetic?: Aesthetic;
  lighting?: Lighting;
  includeText?: boolean;
  targetAudience?: string;
  mood?: string;
}

export interface EnhancedPromptResponse {
  enhanced_prompt: string;
  color_theme: ColorTheme;
  typography: TypographyStyle;
  aesthetic: Aesthetic;
  lighting: Lighting;
  suggestions: {
    color_palette: string[];
    recommended_fonts: string[];
    composition_tips: string[];
  };
}

// Default presets for different use cases
const THEME_PRESETS = {
  gaming: {
    colorTheme: "neon" as ColorTheme,
    typography: "bold-sans" as TypographyStyle,
    aesthetic: "maximalist" as Aesthetic,
    lighting: "neon-glow" as Lighting,
  },
  education: {
    colorTheme: "vibrant" as ColorTheme,
    typography: "modern-geometric" as TypographyStyle,
    aesthetic: "editorial" as Aesthetic,
    lighting: "studio-professional" as Lighting,
  },
  luxury: {
    colorTheme: "natural" as ColorTheme,
    typography: "elegant-serif" as TypographyStyle,
    aesthetic: "luxury" as Aesthetic,
    lighting: "dramatic-rim" as Lighting,
  },
  tech: {
    colorTheme: "high-contrast" as ColorTheme,
    typography: "minimal" as TypographyStyle,
    aesthetic: "minimalist" as Aesthetic,
    lighting: "studio-professional" as Lighting,
  },
  entertainment: {
    colorTheme: "gradient" as ColorTheme,
    typography: "bold-sans" as TypographyStyle,
    aesthetic: "cinematic" as Aesthetic,
    lighting: "dramatic-rim" as Lighting,
  },
  lifestyle: {
    colorTheme: "pastel" as ColorTheme,
    typography: "handwritten" as TypographyStyle,
    aesthetic: "playful" as Aesthetic,
    lighting: "natural-soft" as Lighting,
  },
};

// Color theme descriptions
const COLOR_THEME_DESCRIPTIONS: Record<ColorTheme, string> = {
  vibrant: "Bold, saturated colors with high energy and pop",
  "dark-moody": "Deep, dark tones with atmospheric shadows and depth",
  pastel: "Soft, muted colors with a gentle, approachable feel",
  neon: "Bright, glowing colors (cyan, magenta, lime) with electric vibes",
  natural: "Earth tones, greens, and warm, organic colors",
  monochrome: "Single color family with varying shades and tints",
  gradient: "Smooth transitions between multiple colors",
  "high-contrast": "Stark differences between light and dark areas",
};

// Typography descriptions
const TYPOGRAPHY_DESCRIPTIONS: Record<TypographyStyle, string> = {
  "bold-sans": "Strong, modern sans-serif typefaces (Arial, Montserrat, Bebas)",
  "elegant-serif": "Sophisticated serif fonts (Playfair, Garamond, Bodoni)",
  "modern-geometric": "Geometric shapes and contemporary fonts (Futura, Poppins)",
  handwritten: "Organic, custom lettering or brush script styles",
  retro: "Vintage-inspired typography (70s, 80s, 90s styles)",
  minimal: "Clean, minimal sans-serif with ample whitespace (Helvetica, Univers)",
  graffiti: "Street art and urban-style lettering",
};

// Aesthetic descriptions
const AESTHETIC_DESCRIPTIONS: Record<Aesthetic, string> = {
  cinematic: "Movie-like quality with professional color grading",
  minimalist: "Reduced to essentials with clean composition",
  maximalist: "Rich, detailed, layered with textures and patterns",
  "retro-futuristic": "Blend of vintage and futuristic elements",
  luxury: "Premium, sophisticated, high-end aesthetic",
  playful: "Fun, whimsical, and engaging atmosphere",
  editorial: "Magazine-style composition with strong hierarchy",
  brutalist: "Raw, bold, unrefined architecture-inspired design",
};

// Lighting descriptions
const LIGHTING_DESCRIPTIONS: Record<Lighting, string> = {
  "dramatic-rim": "Subject backlit with glowing rim light separation",
  "studio-professional": "Three-point studio lighting for clarity and depth",
  "moody-low-key": "Limited light with dramatic shadows and mystery",
  "natural-soft": "Diffused natural daylight, gentle and warm",
  "neon-glow": "Neon signs and glowing elements throughout",
  volumetric: "Light rays and atmospheric fog for depth",
};

// Color palette suggestions for each theme
const COLOR_PALETTES: Record<ColorTheme, string[]> = {
  vibrant: ["#FF006E", "#FB5607", "#FFBE0B", "#8338EC"],
  "dark-moody": ["#1B263B", "#415A77", "#778DA9", "#B7C3D1"],
  pastel: ["#FFD3E1", "#C7CEEA", "#B5EAD7", "#FFDFD3"],
  neon: ["#00D9FF", "#FF006E", "#8338EC", "#FFBE0B"],
  natural: ["#2D6A4F", "#40916C", "#D6CDA4", "#A4AC86"],
  monochrome: ["#000000", "#333333", "#666666", "#CCCCCC"],
  gradient: ["#667eea", "#764ba2", "#f093fb"],
  "high-contrast": ["#000000", "#FFFFFF", "#FF0000", "#00FF00"],
};

// Font recommendations for each typography style
const FONT_RECOMMENDATIONS: Record<TypographyStyle, string[]> = {
  "bold-sans": ["Montserrat Bold", "Bebas Neue", "Arial Black", "Poppins Bold"],
  "elegant-serif": ["Playfair Display", "Garamond", "Bodoni", "Cormorant Garamond"],
  "modern-geometric": ["Futura", "Poppins", "Geometric Sans 703", "Archivo Black"],
  handwritten: ["Brush Script", "Pacifico", "Dancing Script", "Great Vibes"],
  retro: ["Righteous", "Righteous", "Fredoka One", "Bangers"],
  minimal: ["Helvetica", "Univers", "Inter", "Roboto"],
  graffiti: ["Graffiti", "Wildly Awesome", "Sketchy", "Marker Felt"],
};

// Composition tips for each aesthetic
const COMPOSITION_TIPS: Record<Aesthetic, string[]> = {
  cinematic: [
    "Use rule of thirds for subject placement",
    "Include depth layers (foreground, subject, background)",
    "Enhance with color grading and contrast",
    "Add subtle motion blur or depth effects",
  ],
  minimalist: [
    "Limit elements to 2-3 focal points maximum",
    "Abundant negative space (50%+ of frame)",
    "Single dominant color",
    "Clean, uncluttered background",
  ],
  maximalist: [
    "Fill frame with rich details and patterns",
    "Layered textures and colors throughout",
    "Multiple points of interest",
    "Bold, saturated colors",
  ],
  "retro-futuristic": [
    "Blend vintage and modern elements",
    "Use retro color palettes with neon accents",
    "Include futuristic geometric shapes",
    "Combine analog textures with digital effects",
  ],
  luxury: [
    "Focus on fine details and craftsmanship",
    "Ambient lighting with subtle shadows",
    "Gold, silver, or bronze accents",
    "Elegant, uncluttered composition",
  ],
  playful: [
    "Bright, cheerful colors",
    "Dynamic composition with movement",
    "Include human expressions or joy",
    "Unexpected angles and compositions",
  ],
  editorial: [
    "Strong visual hierarchy",
    "Text integration with design",
    "Bold contrasts between elements",
    "Professional layout grid",
  ],
  brutalist: [
    "Raw, exposed textures and materials",
    "Heavy geometric shapes",
    "Limited, bold color palette",
    "Unpolished, authentic appearance",
  ],
};

/**
 * Enhance a prompt with customizable themes and styles
 */
async function improvedPrompt(
  prompt: string,
  options?: PromptEnhancementOptions
): Promise<EnhancedPromptResponse> {
  try {
    // Default options
    const colorTheme = options?.colorTheme || "vibrant";
    const typography = options?.typography || "bold-sans";
    const aesthetic = options?.aesthetic || "cinematic";
    const lighting = options?.lighting || "dramatic-rim";

    const systemPrompt = `
You are an expert in thumbnail design, visual storytelling, and digital aesthetics.
You understand color theory, typography, composition, and how to create eye-catching thumbnails.

You will enhance prompts with specific design direction while maintaining the user's core idea.

Return ONLY valid JSON:
{
  "enhanced_prompt": "A detailed, vivid visual description...",
  "design_notes": "Key design elements and inspiration",
  "key_elements": ["element1", "element2", "element3"]
}

Be specific about visual details, colors, lighting, and composition.
`;

    const userPrompt = `
Transform this into a high-converting YouTube thumbnail prompt:

"${prompt}"

Apply these design specifications:

**Color Theme:** ${colorTheme}
- Description: ${COLOR_THEME_DESCRIPTIONS[colorTheme]}
- Suggested palette: ${COLOR_PALETTES[colorTheme].join(", ")}

**Typography Style:** ${typography}
- Description: ${TYPOGRAPHY_DESCRIPTIONS[typography]}
- Recommended fonts: ${FONT_RECOMMENDATIONS[typography].join(", ")}

**Aesthetic Direction:** ${aesthetic}
- Description: ${AESTHETIC_DESCRIPTIONS[aesthetic]}
- Composition tips: ${COMPOSITION_TIPS[aesthetic].slice(0, 2).join("; ")}

**Lighting:** ${lighting}
- Description: ${LIGHTING_DESCRIPTIONS[lighting]}

**Core Thumbnail Requirements:**
- Composition: 16:9 widescreen format
- Focal subject: Clear, strong center of attention
- Visual impact: Immediately eye-catching and engaging
- Text integration: ${options?.includeText !== false ? "Bold, readable text (3–6 words)" : "Minimal or no text"}
- Target audience: ${options?.targetAudience || "General YouTube viewers"}
- Mood/Emotion: ${options?.mood || "Engaging and intriguing"}
- Technical: Professional lighting, no clutter, high contrast
- Uniqueness: Stands out in YouTube search results and recommendations

Create an extremely detailed visual prompt that incorporates all these elements seamlessly.
Include specific color hex codes, exact lighting angles, and precise compositional guidance.
`;

   const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:3000", // Optional for OpenRouter rankings
        "X-Title": "AI Interview Prep",
      },
      body: JSON.stringify({
        model: "nvidia/nemotron-3-nano-30b-a3b:free",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        // Note: Check model support for json_object if using fetch
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`OpenRouter API error: ${response.status} - ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error("Empty response from OpenRouter");
    }

    const parsedResponse = JSON.parse(content);

    return {
      enhanced_prompt: parsedResponse.enhanced_prompt,
      color_theme: colorTheme,
      typography: typography,
      aesthetic: aesthetic,
      lighting: lighting,
      suggestions: {
        color_palette: COLOR_PALETTES[colorTheme],
        recommended_fonts: FONT_RECOMMENDATIONS[typography],
        composition_tips: COMPOSITION_TIPS[aesthetic],
      },
    };
  } catch (error) {
    console.error("Prompt enhancement failed:", error);
    throw error;
  }
}
/**
 * Get available presets for different content types
 */
export function getThemePresets() {
  return THEME_PRESETS;
}

/**
 * Enhance prompt with a preset theme
 */
export async function improvedPromptWithPreset(
  prompt: string,
  preset: keyof typeof THEME_PRESETS
): Promise<EnhancedPromptResponse> {
  const presetOptions = THEME_PRESETS[preset];
  return improvedPrompt(prompt, presetOptions);
}

/**
 * Get all available themes and options
 */
export function getAvailableThemes() {
  return {
    colorThemes: Object.keys(COLOR_THEME_DESCRIPTIONS),
    typographyStyles: Object.keys(TYPOGRAPHY_DESCRIPTIONS),
    aesthetics: Object.keys(AESTHETIC_DESCRIPTIONS),
    lightingTypes: Object.keys(LIGHTING_DESCRIPTIONS),
    presets: Object.keys(THEME_PRESETS),
  };
}

export default improvedPrompt