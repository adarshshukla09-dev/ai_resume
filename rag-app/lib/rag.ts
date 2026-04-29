import {client, COLLECTION_NAME} from "./qdrant";
import {embeddings} from "./embedding";

export async function searchSimilarity(query: string) {
    try {
        const queryVector = await embeddings(query as any);
        console.log(queryVector);
        const searchResults = await client.search(COLLECTION_NAME, {
            vector: queryVector,
            limit: 5,
        });
        
        return searchResults;
    } catch (error) {
        error instanceof Error ? console.error(error.message) : console.error(error);
    }
}