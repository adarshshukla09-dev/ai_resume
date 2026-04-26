"use server";

import { HfInference, InferenceClient } from "@huggingface/inference";
import { v2 as cloudinary, UploadApiResponse } from "cloudinary";
import improvedPrompt, { PromptEnhancementOptions } from "@/lib/ai.service/openrouter.service";
const token = process.env.HUGGINGFACE_TOKEN;
const client = new InferenceClient(token!);

interface GenerateThumbnailResult {
  imageUrl: string;
  revisedPrompt: string;
  generatedAt: string;
}

const HF_INFERENCE_TIMEOUT = 120000;
const MAX_PROMPT_LENGTH = 500;
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const CLOUDINARY_FOLDER = process.env.CLOUDINARY_THUMBNAIL_FOLDER || "thumbnails";
const CLOUDINARY_FORMAT = process.env.CLOUDINARY_THUMBNAIL_FORMAT || "jpg";

class ThumbnailGenerationError extends Error {
  constructor(
    public code: string,
    message: string,
    public originalError?: unknown
  ) {
    super(message);
    this.name = "ThumbnailGenerationError";
  }
}

function validatePrompt(prompt: string): void {
  if (!prompt || typeof prompt !== "string") {
    throw new Error("Prompt must be a non-empty string");
  }

  const trimmed = prompt.trim();
  if (trimmed.length === 0) {
    throw new Error("Prompt cannot be empty or whitespace only");
  }

  if (trimmed.length > MAX_PROMPT_LENGTH) {
    throw new Error(
      `Prompt exceeds maximum length of ${MAX_PROMPT_LENGTH} characters`
    );
  }
}

export async function generateThumbnail(
  prompt: string,options?: PromptEnhancementOptions
): Promise<GenerateThumbnailResult> {
  try {
    // 1. Validate input
    validatePrompt(prompt);
    const trimmedPrompt = prompt.trim();

    // 2. Enhance prompt
    let revisedPrompt: string;
    try {
      const improved = await improvedPrompt(trimmedPrompt, options);
      revisedPrompt = improved.enhanced_prompt;

      if (!revisedPrompt || typeof revisedPrompt !== "string") {
        throw new Error("Invalid response from prompt improvement service");
      }
    } catch (error) {
      throw new ThumbnailGenerationError(
        "PROMPT_IMPROVEMENT_FAILED",
        "Failed to improve prompt quality",
        error
      );
    }

    // 3. Generate image with timeout
  let blob: Blob;

  // Use 'unknown' first to break the strict 'string' inference from the SDK
  const response = await client.textToImage({
    model: "black-forest-labs/FLUX.1-dev",
    inputs: revisedPrompt,
    provider: "fal-ai",
  }) as unknown; 

  // 1. Check if it's a URL string (common with providers)
  if (typeof response === "string") {
    const fetchedImage = await fetch(response);
    if (!fetchedImage.ok) throw new Error("Failed to fetch image from provider URL");
    blob = await fetchedImage.blob();
  } 
  // 2. Check if it's already a Blob
  else if (response instanceof Blob) {
    blob = response;
  } 
  else {
    throw new Error("Unexpected response format: Expected Blob or URL string");
  }

  // ✅ Existing validation
  if (blob.size === 0) throw new Error("Generated image is empty");

  if (blob.size > MAX_IMAGE_SIZE) {
    throw new Error(
      `Generated image exceeds maximum size of ${MAX_IMAGE_SIZE} bytes`
    );
  }
    // 4. Convert Blob to Buffer
    let buffer: Buffer;
    try {
      const arrayBuffer = await blob.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
    } catch (error) {
      throw new ThumbnailGenerationError(
        "BUFFER_CONVERSION_FAILED",
        "Failed to convert generated image to buffer",
        error
      );
    }

    // 5. Upload to Cloudinary
    // ✅ FIX FOR ERROR 2: Use UploadApiResponse directly
    let uploadResponse: UploadApiResponse;
    try {
      uploadResponse = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            resource_type: "image",
            folder: CLOUDINARY_FOLDER,
            format: CLOUDINARY_FORMAT,
            timeout: 30000,
          },
          (err, res) => {
            if (err) {
              reject(err);
            } else if (res) {
              resolve(res);
            } else {
              reject(new Error("Cloudinary upload failed: no response"));
            }
          }
        );

        uploadStream.on("error", (err) => {
          reject(new ThumbnailGenerationError(
            "UPLOAD_STREAM_ERROR",
            "Error during Cloudinary upload stream",
            err
          ));
        });

        uploadStream.end(buffer);
      });
    } catch (error) {
      throw new ThumbnailGenerationError(
        "CLOUDINARY_UPLOAD_FAILED",
        "Failed to upload image to Cloudinary",
        error
      );
    }

    console.info("[generateThumbnail] Success", {
      publicId: uploadResponse.public_id,
      blobSize: blob.size,
      cloudinaryBytes: uploadResponse.bytes,
      timestamp: new Date().toISOString(),
    });

    return {
      imageUrl: uploadResponse.secure_url,
      revisedPrompt,
      generatedAt: new Date().toISOString(),
    };
  } catch (error) {
    if (error instanceof ThumbnailGenerationError) {
      console.error("[generateThumbnail] Controlled error", {
        code: error.code,
        message: error.message,
        timestamp: new Date().toISOString(),
      });
      throw error;
    }

    console.error("[generateThumbnail] Unexpected error", {
      error,
      timestamp: new Date().toISOString(),
    });
    throw new ThumbnailGenerationError(
      "UNKNOWN_ERROR",
      "An unexpected error occurred during thumbnail generation",
      error
    );
  }
}