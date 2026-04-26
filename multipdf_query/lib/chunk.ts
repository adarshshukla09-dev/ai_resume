import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

export async function chunkText(text: string) {
    const splitter = new RecursiveCharacterTextSplitter({ chunkSize: 500,chunkOverlap
        : 100
     }); 
    const chunks = await splitter.createDocuments([text]);
    
    return chunks;
}