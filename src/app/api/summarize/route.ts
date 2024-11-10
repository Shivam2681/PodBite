import { NextRequest, NextResponse } from "next/server";
import { YoutubeLoader } from "@langchain/community/document_loaders/web/youtube";
import { loadSummarizationChain } from "langchain/chains";
import { TokenTextSplitter } from "langchain/text_splitter";
import { Document } from "@langchain/core/documents";
import { PromptTemplate } from "@langchain/core/prompts";
import { summaryTemplate } from "@/lib/prompts";
import { geminiModel } from "@/lib/langchain";
import { getServerSession } from "next-auth";
import { authOptions, CustomSession } from "../auth/[...nextauth]/options";
import { getUserCoins } from "@/actions/fetchActions";
import { coinsSpend, minusCoins, updateSummary } from "@/actions/commonActions";
import prisma from "@/lib/db.config";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

interface SummarizePayload {
  url: string;
  id: string;
}

// Custom error handler for Gemini API
const handleGeminiError = async (error: any, docsSummary: Document[], summaryPrompt: PromptTemplate) => {
  console.error("Initial Gemini API error:", error);
  
  // If it's a safety error, try with more conservative settings
  if (error.message?.includes('SAFETY')) {
    // Create a Langchain-compatible model with conservative settings
    const conservativeModel = new ChatGoogleGenerativeAI({
      modelName: "gemini-pro",
      maxOutputTokens: 1024,
      temperature: 0.1,
      apiKey: process.env.GOOGLE_API_KEY!,
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
          threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
        },
      ],
    });

    const fallbackChain = loadSummarizationChain(conservativeModel, {
      type: "map_reduce",
      verbose: true,
      combinePrompt: summaryPrompt,
    });

    try {
      return await fallbackChain.invoke({ input_documents: docsSummary });
    } catch (fallbackError) {
      console.error("Fallback attempt failed:", fallbackError);
      throw new Error("Unable to process content due to content restrictions");
    }
  }
  
  throw error;
};

export async function POST(req: NextRequest) {
  try {
    const session: CustomSession | null = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: "UnAuthorized" }, { status: 401 });
    }
    const body: SummarizePayload = await req.json();

    // Check user coins
    const userCoins = await getUserCoins(session?.user?.id!);
    if (userCoins === null || (userCoins?.coins && userCoins.coins < 10)) {
      return NextResponse.json(
        {
          message: "You don't have sufficient coins for summary. Please add your coins.",
        },
        { status: 400 }
      );
    }

    // Check for existing summary
    const oldSummary = await prisma.summary.findFirst({
      select: {
        response: true,
      },
      where: {
        url: body.url,
      },
    });

    if (oldSummary?.response) {
      await minusCoins(session?.user?.id!);
      await coinsSpend(session?.user?.id!, body?.id!);
      return NextResponse.json({
        message: "Podcast video Summary",
        data: oldSummary.response,
      });
    }

    // Extract video transcript
    let text: Document<Record<string, any>>[];
    try {
      const loader = YoutubeLoader.createFromUrl(body.url!, {
        language: "en",
        addVideoInfo: true,
      });
      text = await loader.load();
    } catch (error) {
      return NextResponse.json(
        {
          message: "No Transcript available for this video. Please try another video",
        },
        { status: 404 }
      );
    }

    // Process the transcript
    const splitter = new TokenTextSplitter({
      chunkSize: 8000, // Reduced for Gemini
      chunkOverlap: 200,
    });
    
    const docsSummary = await splitter.splitDocuments(text);
    const summaryPrompt = PromptTemplate.fromTemplate(summaryTemplate);
    
    const summaryChain = loadSummarizationChain(geminiModel, {
      type: "map_reduce",
      verbose: true,
      combinePrompt: summaryPrompt,
    });

    let res;
    try {
      res = await summaryChain.invoke({ input_documents: docsSummary });
    } catch (error) {
      res = await handleGeminiError(error, docsSummary, summaryPrompt);
    }

    // Update database and coins
    await minusCoins(session?.user?.id!);
    await coinsSpend(session?.user?.id!, body?.id!);
    await updateSummary(body?.id!, res?.text);

    return NextResponse.json({
      message: "Podcast video Summary",
      data: res?.text,
    });
  } catch (error) {
    console.error("Error in summary generation:", error);
    return NextResponse.json(
      { 
        message: error.message || "Something went wrong. Please try again!",
        error: process.env.NODE_ENV === 'development' ? error.toString() : undefined 
      },
      { status: 500 }
    );
  }
}