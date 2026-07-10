import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);

const SYSTEM_PROMPT = `
You are a data extraction assistant for a travel planning app. 
Your job is to read Instagram captions and extract specific details about the location being promoted.

You must return a valid JSON object matching this exact schema:
{
  "businessName": "The name of the restaurant, park, or venue (or null if unknown)",
  "city": "The city it is located in (or null if unknown)",
  "priceTier": "One of: '$', '$$', '$$$', '$$$$', or null",
  "vibeTags": ["An array of 1 to 3 descriptive tags like 'casual', 'date night', 'hidden gem', 'patio']
}
If you cannot find the information, use null. Do not invent details.
`;

export async function POST() {
  try {
    const pendingItems = await db.inspirationItem.findMany({
      where: { status: "pending" },
      take: 10,
    });

    if (pendingItems.length === 0) {
      return NextResponse.json(
        { message: "No pending items to process." },
        { status: 200 },
      );
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-3.5-flash",
      generationConfig: { responseMimeType: "application/json" },
      systemInstruction: SYSTEM_PROMPT,
    });

    let successCount = 0;
    let failCount = 0;

    for (const item of pendingItems) {
      if (!item.description) {
        await db.inspirationItem.update({
          where: { id: item.id },
          data: { status: "failed_no_caption" },
        });
        failCount++;
        continue;
      }

      try {
        const result = await model.generateContent(
          `Extract the details from this caption: "${item.description}"`,
        );
        let rawContent = result.response.text() || "{}";

        // BUGFIX: Strip out Markdown formatting if Gemini accidentally included it
        rawContent = rawContent
          .replace(/```json/g, "")
          .replace(/```/g, "")
          .trim();

        const extractedData = JSON.parse(rawContent);

        await db.inspirationItem.update({
          where: { id: item.id },
          data: { rawMetadata: extractedData, status: "processed" },
        });
        successCount++;
      } catch (error) {
        // BUGFIX: Print the exact error so we can see what went wrong!
        console.error(`AI failed for item ${item.id}. Error:`, error);

        await db.inspirationItem.update({
          where: { id: item.id },
          data: { status: "failed_extraction" },
        });
        failCount++;
      }
    }

    return NextResponse.json(
      { message: "Batch complete.", successCount, failCount },
      { status: 200 },
    );
  } catch (error) {
    console.error("Critical Route Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
