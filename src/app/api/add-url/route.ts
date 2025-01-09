// import { NextRequest, NextResponse } from "next/server";
// import { getToken } from "next-auth/jwt";
// import prisma from "@/lib/db.config";
// import { summarySchema } from "@/validations/summaryValidation";
// import vine, { errors } from "@vinejs/vine";
// import { YoutubeLoader } from "@langchain/community/document_loaders/web/youtube";
// import { getUserCoins } from "@/actions/fetchActions";

// // Separate the YouTube loading logic
// async function loadYouTubeTranscript(url: string) {
//   const loader = YoutubeLoader.createFromUrl(url, {
//     language: "en",
//     addVideoInfo: true,
//   });
//   return await loader.load();
// }

// export async function POST(req: NextRequest) {
//   try {
//     // Authentication check
//     const token = await getToken({ req });
//     if (!token) {
//       return NextResponse.json({ message: "UnAuthorized" }, { status: 401 });
//     }

//     // Validation
//     const body = await req.json();
//     const validator = vine.compile(summarySchema);
//     const payload = await validator.validate(body);

//     // Coin check
//     const userCoins = await getUserCoins(payload.user_id);
//     if (!userCoins?.coins || userCoins.coins < 10) {
//       return NextResponse.json(
//         {
//           message: "Insufficient coins for summary. Please add more coins.",
//         },
//         { status: 400 }
//       );
//     }

//     // Load YouTube transcript
//     let transcript;
//     try {
//       transcript = await loadYouTubeTranscript(payload.url!);
//     } catch (error) {
//       return NextResponse.json(
//         {
//           message: "No transcript available for this video. Please try another video.",
//         },
//         { status: 404 }
//       );
//     }

//     // Create summary
//     const summary = await prisma.summary.create({
//       data: {
//         ...payload,
//         user_id: Number(payload.user_id),
//         title: transcript[0].metadata?.title ?? "No Title found!",
//       },
//     });

//     return NextResponse.json({
//       message: "URL Added Successfully!",
//       data: summary,
//     });
//   } catch (error) {
//     if (error instanceof errors.E_VALIDATION_ERROR) {
//       return NextResponse.json(
//         { message: "Validation error", errors: error.messages },
//         { status: 422 }
//       );
//     }
//     return NextResponse.json(
//       { message: "Internal server error" },
//       { status: 500 }
//     );
//   }
// }



import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import prisma from "@/lib/db.config";
import { summarySchema } from "@/validations/summaryValidation";
import vine, { errors } from "@vinejs/vine";
import { YoutubeLoader } from "@langchain/community/document_loaders/web/youtube"; 
import { getUserCoins } from "@/actions/fetchActions";
import { Document } from "langchain/document";

// Define the transcript type
interface TranscriptMetadata {
 title?: string;
 [key: string]: any;
}

// Enhanced YouTube loading logic with better error handling
async function loadYouTubeTranscript(url: string): Promise<Document<TranscriptMetadata>[]> {
 const timeoutDuration = 30000; // 30 seconds timeout

 try {
   console.log('Starting transcript load for URL:', url);
   
   // Validate YouTube URL
   const videoUrl = new URL(url);
   if (!videoUrl.hostname.includes('youtube.com') && !videoUrl.hostname.includes('youtu.be')) {
     throw new Error('Invalid YouTube URL');
   }

   const loader = YoutubeLoader.createFromUrl(url, {
     language: "en",
     addVideoInfo: true,
   });

   // Use Promise.race to implement timeout
   const transcriptPromise = loader.load();
   const transcript = await Promise.race([
     transcriptPromise,
     new Promise<never>((_, reject) => 
       setTimeout(() => reject(new Error('Transcript loading timed out')), timeoutDuration)
     )
   ]);

   if (!transcript || transcript.length === 0) {
     throw new Error('No transcript data received');
   }

   console.log('Transcript loaded successfully');
   return transcript;
 } catch (error) {
   console.error('Detailed YouTube transcript error:', {
     error: error instanceof Error ? error.message : 'Unknown error',
     stack: error instanceof Error ? error.stack : undefined,
     url: url
   });
   throw error;
 }
}

export async function POST(req: NextRequest) {
 try {
   // Authentication check
   const token = await getToken({ req });
   if (!token) {
     return NextResponse.json({ message: "UnAuthorized" }, { status: 401 });
   }

   // Validation with error logging
   let body;
   try {
     body = await req.json();
   } catch (error) {
     console.error('Request body parsing error:', error);
     return NextResponse.json(
       { message: "Invalid request body" },
       { status: 400 }
     );
   }

   // Schema validation
   let payload;
   try {
     const validator = vine.compile(summarySchema);
     payload = await validator.validate(body);
   } catch (error) {
     console.error('Validation error:', error);
     return NextResponse.json(
       { message: "Validation failed", error: error instanceof Error ? error.message : 'Unknown error' },
       { status: 422 }
     );
   }

   // Coin check with enhanced error handling
   try {
     const userCoins = await getUserCoins(payload.user_id);
     if (!userCoins?.coins || userCoins.coins < 10) {
       return NextResponse.json(
         {
           message: "Insufficient coins for summary. Please add more coins.",
           currentCoins: userCoins?.coins || 0
         },
         { status: 400 }
       );
     }
   } catch (error) {
     console.error('Coin check error:', error);
     return NextResponse.json(
       { message: "Failed to verify coin balance" },
       { status: 500 }
     );
   }

   // Load YouTube transcript with detailed error handling
   let transcript: Document<TranscriptMetadata>[];
   try {
     transcript = await loadYouTubeTranscript(payload.url!);
   } catch (error) {
     const errorMessage = error instanceof Error ? error.message : 'Unknown error';
     console.error('Transcript loading failed:', errorMessage);
     
     return NextResponse.json(
       {
         message: errorMessage.includes('timed out') 
           ? "Video processing timed out. Please try again."
           : "No transcript available for this video. Please try another video.",
         error: errorMessage
       },
       { status: 404 }
     );
   }

   // Create summary with error handling
   let summary;
   try {
     summary = await prisma.summary.create({
       data: {
         ...payload,
         user_id: Number(payload.user_id),
         title: transcript[0]?.metadata?.title ?? "No Title found!", // Added optional chaining
       },
     });
   } catch (error) {
     console.error('Database error:', error);
     return NextResponse.json(
       { message: "Failed to save summary" },
       { status: 500 }
     );
   }

   return NextResponse.json({
     message: "URL Added Successfully!",
     data: summary,
   });
   
 } catch (error) {
   console.error('Global error:', error);
   
   if (error instanceof errors.E_VALIDATION_ERROR) {
     return NextResponse.json(
       { message: "Validation error", errors: error.messages },
       { status: 422 }
     );
   }
   
   return NextResponse.json(
     { 
       message: "Internal server error",
       error: error instanceof Error ? error.message : 'Unknown error'
     },
     { status: 500 }
   );
 }
}