// import { summarySchema } from "@/validations/summaryValidation";
// import vine, { errors } from "@vinejs/vine";
// import { NextRequest, NextResponse } from "next/server";
// import { getToken } from "next-auth/jwt";
// import prisma from "@/lib/db.config";
// import { Document } from "@langchain/core/documents";
// import { YoutubeLoader } from "@langchain/community/document_loaders/web/youtube";
// import { getUserCoins } from "@/actions/fetchActions";

// export async function POST(req: NextRequest) {
//   const token = await getToken({ req });
//   if (!token) {
//     return NextResponse.json({ message: "UnAuthorized" }, { status: 401 });
//   }
//   try {
//     const body = await req.json();
//     const validator = vine.compile(summarySchema);
//     const payload = await validator.validate(body);

//     // * Check if user has sufficient coins or not
//     const userConis = await getUserCoins(payload.user_id);
//     if (userConis === null || (userConis?.coins && userConis.coins < 10)) {
//       return NextResponse.json(
//         {
//           message:
//             "You don't have sufficient coins for summary.Please add your coins.",
//         },
//         { status: 400 }
//       );
//     }

//     let text: Document<Record<string, any>>[];
//     try {
//       const loader = YoutubeLoader.createFromUrl(payload.url!, {
//         language: "en",
//         addVideoInfo: true,
//       });
//       text = await loader.load();
//     } catch (error) {
//       return NextResponse.json(
//         {
//           message:
//             "No Transcript available for this video.Plese try another video",
//         },
//         { status: 404 }
//       );
//     }

//     const chat = await prisma.summary.create({
//       data: {
//         ...payload,
//         user_id: Number(payload.user_id),
//         title: text[0].metadata?.title ?? "No Title found!",
//       },
//     });
//     return NextResponse.json({
//       message: "Url Added Successfully!",
//       data: chat,
//     });
//   } catch (error) {
//     if (error instanceof errors.E_VALIDATION_ERROR) {
//       return NextResponse.json(
//         { message: "Please check validation errors", errors: error.messages },
//         { status: 422 }
//       );
//     }
//     return NextResponse.json(
//       { message: "Something went wrong.Please try again!" },
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

// Separate the YouTube loading logic
async function loadYouTubeTranscript(url: string) {
  const loader = YoutubeLoader.createFromUrl(url, {
    language: "en",
    addVideoInfo: true,
  });
  return await loader.load();
}

export async function POST(req: NextRequest) {
  try {
    // Authentication check
    const token = await getToken({ req });
    if (!token) {
      return NextResponse.json({ message: "UnAuthorized" }, { status: 401 });
    }

    // Validation
    const body = await req.json();
    const validator = vine.compile(summarySchema);
    const payload = await validator.validate(body);

    // Coin check
    const userCoins = await getUserCoins(payload.user_id);
    if (!userCoins?.coins || userCoins.coins < 10) {
      return NextResponse.json(
        {
          message: "Insufficient coins for summary. Please add more coins.",
        },
        { status: 400 }
      );
    }

    // Load YouTube transcript
    let transcript;
    try {
      transcript = await loadYouTubeTranscript(payload.url!);
    } catch (error) {
      return NextResponse.json(
        {
          message: "No transcript available for this video. Please try another video.",
        },
        { status: 404 }
      );
    }

    // Create summary
    const summary = await prisma.summary.create({
      data: {
        ...payload,
        user_id: Number(payload.user_id),
        title: transcript[0].metadata?.title ?? "No Title found!",
      },
    });

    return NextResponse.json({
      message: "URL Added Successfully!",
      data: summary,
    });
  } catch (error) {
    if (error instanceof errors.E_VALIDATION_ERROR) {
      return NextResponse.json(
        { message: "Validation error", errors: error.messages },
        { status: 422 }
      );
    }
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}