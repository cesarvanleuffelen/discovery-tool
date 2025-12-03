import { NextRequest, NextResponse } from 'next/server';
import { Pinecone } from '@pinecone-database/pinecone';
import { pipeline } from '@xenova/transformers';

// Configuration
const PINECONE_API_KEY = process.env.NEXT_PUBLIC_PINECONE_API_KEY;
const PINECONE_INDEX_NAME = process.env.NEXT_PUBLIC_PINECONE_INDEX_NAME || "partner-use-cases";
const EMBEDDING_MODEL = "Xenova/all-MiniLM-L6-v2";

// Cache the embedding model
let embeddingModel: any = null;

async function getEmbeddingModel() {
    if (!embeddingModel) {
        console.log("Loading embedding model...");
        embeddingModel = await pipeline('feature-extraction', EMBEDDING_MODEL);
        console.log("Embedding model loaded");
    }
    return embeddingModel;
}

async function generateEmbedding(text: string): Promise<number[]> {
    const model = await getEmbeddingModel();
    const output = await model(text, { pooling: 'mean', normalize: true });
    return Array.from(output.data);
}

interface UseCase {
    title: string;
    partner_name: string;
    url: string;
    text: string;
    score: number;
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { companyName, description } = body;

        if (!description) {
            return NextResponse.json(
                { error: 'Description is required' },
                { status: 400 }
            );
        }

        // Create search query (using description, company name is optional)
        const searchQuery = companyName
            ? `Company: ${companyName}. Description: ${description}`
            : `Description: ${description}`;

        console.log("Generating embedding for query...");
        const queryEmbedding = await generateEmbedding(searchQuery);

        // Initialize Pinecone
        if (!PINECONE_API_KEY) {
            return NextResponse.json(
                { error: 'PINECONE_API_KEY is not set' },
                { status: 500 }
            );
        }
        const pc = new Pinecone({
            apiKey: PINECONE_API_KEY || "",
        });
        const index = pc.index(PINECONE_INDEX_NAME);

        // Search in Pinecone
        console.log("Searching Pinecone...");
        const searchResults = await index.query({
            vector: queryEmbedding,
            topK: 10,
            includeMetadata: true,
        });

        // Format results
        const useCases: UseCase[] = searchResults.matches.map((match: any) => ({
            title: match.metadata?.title || "",
            partner_name: match.metadata?.partner_name || "",
            url: match.metadata?.url || "",
            text: match.metadata?.text || "",
            score: match.score || 0,
        }));

        console.log(`Found ${useCases.length} relevant use cases`);

        return NextResponse.json({
            useCases,
            count: useCases.length,
        });
    } catch (error: any) {
        console.error('Error searching use cases:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to search use cases' },
            { status: 500 }
        );
    }
}

