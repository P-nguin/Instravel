import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);

const SYSTEM_PROMPT = `
You are a batch data extraction assistant. 
You will receive a JSON array of Instagram captions, each with a unique 'id'.

For EACH item in the array:
1. Identify the primary business name (restaurant, park, venue).
2. Extract the exact street address, city, and price tier if they are mentioned. 
3. If the address or city is missing from the text, use your internal knowledge of world geography and famous restaurants to confidently fill them in.

You MUST return a valid JSON array matching this exact structure:
[
  {
    "id": "the-item-id",
    "extractedData": {
      "businessName": "Name (or null)",
      "address": "Exact street address or neighborhood (or null)",
      "city": "City (or null)",
      "priceTier": "One of: '$', '$$', '$$$', '$$$$' (or null)",
      "vibeTags": ["tag1", "tag2"]
    }
  }
]
`;

// Ticket 3: The Mapbox Geocoding Helper
async function getCoordinates(address: string, city: string) {
  if (!address && !city) return { lat: null, lng: null };

  const query = encodeURIComponent(`${address || ""} ${city || ""}`.trim());
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  try {
    const res = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${query}.json?access_token=${token}&limit=1`,
    );
    const data = await res.json();

    if (data.features && data.features.length > 0) {
      // Mapbox returns coordinates as an array: [longitude, latitude]
      return {
        lng: data.features[0].center[0],
        lat: data.features[0].center[1],
      };
    }
  } catch (error) {
    console.error("Mapbox Geocoding failed:", error);
  }

  return { lat: null, lng: null };
}

export async function POST() {
  try {
    // Grab up to 50 items at once for the bulk batch
    const pendingItems = await db.inspirationItem.findMany({
      where: { status: "pending" },
      take: 50,
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

    const payloadToProcess = pendingItems.map((item) => ({
      id: item.id,
      caption: item.description || "No caption provided.",
    }));

    let successCount = 0;
    let failCount = 0;

    try {
      // Send the single bulk request to Gemini
      const result = await model.generateContent(
        JSON.stringify(payloadToProcess),
      );
      let rawContent = result.response.text() || "[]";

      rawContent = rawContent
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();
      const batchResults = JSON.parse(rawContent);

      // Loop through Gemini's answers
      for (const resultItem of batchResults) {
        const data = resultItem.extractedData;

        // Ticket 3: Pass the AI's location data into the Mapbox geocoder
        const coords = await getCoordinates(data.address, data.city);

        // Save BOTH the text data and the map coordinates to Prisma
        await db.inspirationItem.update({
          where: { id: resultItem.id },
          data: {
            rawMetadata: data,
            latitude: coords.lat,
            longitude: coords.lng,
            status: "processed",
          },
        });
        successCount++;
      }
    } catch (error) {
      console.error(`Batch AI extraction failed. Error:`, error);
      for (const item of pendingItems) {
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
