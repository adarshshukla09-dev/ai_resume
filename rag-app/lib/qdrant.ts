import { QdrantClient } from "@qdrant/js-client-rest";

// If using the full URL, you don't need host/port separately
// ✅ Fixed: Use only the URL
export const client = new QdrantClient({
    url: process.env.QDRANT_URL || "http://localhost:6333",
});
export const COLLECTION_NAME = "documents";