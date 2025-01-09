// import { NextRequest, NextResponse } from "next/server";
// import { getToken } from "next-auth/jwt";
// import prisma from "@/lib/db.config";
// import { summarySchema } from "@/validations/summaryValidation";
// import vine, { errors } from "@vinejs/vine";
// import { YoutubeLoader } from "@langchain/community/document_loaders/web/youtube";
// import { getUserCoins } from "@/actions/fetchActions";

// // Separate the YouTube loading logic
// async function loadYouTubeTranscript(url: string) {
//   // const loader = YoutubeLoader.createFromUrl(url, {
//   //   language: "en",
//   //   addVideoInfo: true,
//   // });
//   // return await loader.load();
//   try {
//     const loader = YoutubeLoader.createFromUrl(url, {
//       language: "en",
//       addVideoInfo: true,
//     });
//     const transcript = await loader.load();
//     console.log("Transcript Loaded:", transcript);
//     return transcript;
//   } catch (err) {
//     console.error("YouTube Loader Error:", err);
//     throw err; // Re-throw the error for API response handling
//   }

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
//     // try {
//     //   transcript = await loadYouTubeTranscript(payload.url!);
//     // } catch (error) {
//     //   return NextResponse.json(
//     //     {
//     //       message: "No transcript available for this video. Please try another video.",
//     //     },
//     //     { status: 404 }
//     //   );
//     // }
//     try {
//       transcript = await loadYouTubeTranscript(payload.url!);
//     } catch (error) {
//       if (error instanceof Error) {
//         console.error("YouTube Transcript Error:", error.message);
//         return NextResponse.json(
//           { message: "No transcript available for this video.", error: error.message },
//           { status: 404 }
//         );
//       } else {
//         console.error("Unexpected error:", error);
//         return NextResponse.json(
//           { message: "An unknown error occurred while fetching the transcript." },
//           { status: 500 }
//         );
//       }
//     }
    
    

//     // Create summary
//     // const summary = await prisma.summary.create({
//     //   data: {
//     //     ...payload,
//     //     user_id: Number(payload.user_id),
//     //     title: transcript[0].metadata?.title ?? "No Title found!",
//     //   },
//     // });

//     // return NextResponse.json({
//     //   message: "URL Added Successfully!",
//     //   data: summary,
//     // });

//     try {
//       const summary = await prisma.summary.create({
//         data: {
//           ...payload,
//           user_id: Number(payload.user_id),
//           title: transcript[0].metadata?.title ?? "No Title found!",
//         },
//       });
//       return NextResponse.json({
//         message: "URL Added Successfully!",
//         data: summary,
//       });
//     } catch (dbError) {
//       console.error("Prisma Error:", dbError);
//       throw dbError; // Return error response if needed
//     }
    
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

// Helper function to load YouTube transcript with custom headers
async function loadYouTubeTranscript(url: string) {
  try {
    const customFetch = async (input: RequestInfo, init?: RequestInit) => {
      const response = await fetch(input, {
        ...init,
        headers: {
          ...init?.headers,
          "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        },
      });
      return response;
    };

    const loader = YoutubeLoader.createFromUrl(url, {
      language: "en",
      addVideoInfo: true,
      customFetch, // Inject custom fetch function
    });

    const transcript = await loader.load();
    console.log("Transcript Loaded:", transcript);
    return transcript;
  } catch (err) {
    console.error("YouTube Loader Error:", isError(err) ? err.message : err);
    throw err; // Re-throw the error for higher-level handling
  }
}

// Type Guard to Check if Error is an Instance of Error
function isError(error: unknown): error is Error {
  return error instanceof Error;
}

export async function POST(req: NextRequest) {
  try {
    // Authentication Check
    const token = await getToken({ req });
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Validate Input Payload
    const body = await req.json();
    const validator = vine.compile(summarySchema);
    const payload = await validator.validate(body);

    // Check User Coins
    const userCoins = await getUserCoins(payload.user_id);
    if (!userCoins?.coins || userCoins.coins < 10) {
      return NextResponse.json(
        { message: "Insufficient coins for summary. Please add more coins." },
        { status: 400 }
      );
    }

    // Load YouTube Transcript
    let transcript;
    try {
      transcript = await loadYouTubeTranscript(payload.url!);
    } catch (error) {
      console.error("YouTube Transcript Error:", isError(error) ? error.message : error);
      return NextResponse.json(
        {
          message: "No transcript available for this video.",
          error: isError(error) ? error.message : "Unknown error",
        },
        { status: 404 }
      );
    }

    // Create Summary in Database
    try {
      const summary = await prisma.summary.create({
        data: {
          ...payload,
          user_id: Number(payload.user_id),
          title: transcript[0]?.metadata?.title ?? "No Title Found!",
        },
      });

      return NextResponse.json({
        message: "URL Added Successfully!",
        data: summary,
      });
    } catch (dbError) {
      console.error("Database Error:", isError(dbError) ? dbError.message : dbError);
      return NextResponse.json(
        {
          message: "Failed to save summary to the database.",
          error: isError(dbError) ? dbError.message : "Unknown error",
        },
        { status: 500 }
      );
    }
  } catch (error) {
    // Validation Error Handling
    if (error instanceof errors.E_VALIDATION_ERROR) {
      return NextResponse.json(
        { message: "Validation Error", errors: error.messages },
        { status: 422 }
      );
    }

    console.error("Unexpected Error:", isError(error) ? error.message : error);
    return NextResponse.json(
      {
        message: "Internal Server Error",
        error: isError(error) ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
