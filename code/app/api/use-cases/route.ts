import { NextRequest, NextResponse } from 'next/server';
import { Pinecone } from '@pinecone-database/pinecone';
import { OpenAI } from 'openai';

// Route segment config for Vercel
export const runtime = 'nodejs';
export const maxDuration = 60; // 60 seconds for Vercel Pro, 10s for Hobby

// Configuration
const PINECONE_API_KEY = process.env.NEXT_PUBLIC_PINECONE_API_KEY;
const PINECONE_INDEX_NAME = process.env.NEXT_PUBLIC_PINECONE_INDEX_NAME || "partner-use-cases";
const OPENAI_API_KEY = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
const EMBEDDING_MODEL = "text-embedding-3-small"; // 1536 dimensions, or can be reduced to 512

// Initialize OpenAI client
const openai = new OpenAI({
    apiKey: OPENAI_API_KEY,
});

async function generateEmbedding(text: string): Promise<number[]> {
    if (!OPENAI_API_KEY) {
        throw new Error('OPENAI_API_KEY is not set');
    }

    try {
        const response = await openai.embeddings.create({
            model: EMBEDDING_MODEL,
            input: text,
            dimensions: 1536, // Use full dimensions (or 512 if you want smaller)
        });

        return response.data[0].embedding;
    } catch (error: any) {
        console.error('Error generating embedding:', error);
        throw new Error(`Failed to generate embedding: ${error.message}`);
    }
}

interface UseCase {
    title: string;
    partner_name: string;
    url: string;
    text: string;
    score: number;
}

// GET handler for testing
export async function GET() {
    return NextResponse.json({
        message: 'Use Cases API is running',
        method: 'Use POST to search for use cases'
    });
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

        if (!OPENAI_API_KEY) {
            return NextResponse.json(
                { error: 'OPENAI_API_KEY is not set' },
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

