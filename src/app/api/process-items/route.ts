import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);

// The AI is now ONLY responsible for reading the text. No searching, no guessing addresses.
const SYSTEM_PROMPT = `
You are an expert Instagram caption data extractor.
You will receive a JSON array of Instagram captions, each with a unique 'id'.

For EACH item, extract ONLY the following:
1. 'businessName': The core name of the restaurant, venue, or point of interest.
2. 'city': The city it is located in (guess based on context if missing).
3. 'priceTier': Guess the price tier based on caption clues ('$', '$$', '$$$', '$$$$'). Return null if unsure.
4. 'vibeTags': 2-4 descriptive tags based on the text (e.g., ["cozy", "korean bbq"]).

Return a valid JSON array matching this exact structure:
[
  {
    "id": "the-item-id",
    "extractedData": {
      "businessName": "Official Name (or null)",
      "city": "City (or null)",
      "priceTier": "Tier (or null)",
      "vibeTags": ["tag1", "tag2"]
    }
  }
]
`;

// THE TRUE UPGRADE: Google Places API (New)
async function fetchPlaceData(businessName: string, city: string) {
  if (!businessName)
    return { lat: null, lng: null, address: null, priceTier: null };

  const query = `${businessName} ${city || ""}`.trim();
  const key = process.env.GOOGLE_MAPS_API_KEY;

  try {
    // The New API uses a POST request to places.googleapis.com
    const res = await fetch(
      "https://places.googleapis.com/v1/places:searchText",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": key as string,
          // FieldMask is mandatory in the New API to control your billing costs!
          "X-Goog-FieldMask":
            "places.formattedAddress,places.location,places.priceLevel",
        },
        body: JSON.stringify({
          textQuery: query,
          languageCode: "en",
        }),
      },
    );

    const data = await res.json();

    // The New API returns an array called "places"
    if (data.places && data.places.length > 0) {
      const place = data.places[0];

      // The New API returns price levels as specific enum strings
      const priceMap: Record<string, string> = {
        PRICE_LEVEL_FREE: "Free",
        PRICE_LEVEL_INEXPENSIVE: "$",
        PRICE_LEVEL_MODERATE: "$$",
        PRICE_LEVEL_EXPENSIVE: "$$$",
        PRICE_LEVEL_VERY_EXPENSIVE: "$$$$",
      };

      const priceTier = place.priceLevel ? priceMap[place.priceLevel] : null;

      return {
        lat: place.location?.latitude || null,
        lng: place.location?.longitude || null,
        address: place.formattedAddress || null,
        priceTier: priceTier || null,
      };
    } else {
      console.warn(`Places API (New) found no results for: ${query}`);
    }
  } catch (error) {
    console.error("Google Places API (New) failed:", error);
  }

  return { lat: null, lng: null, address: null, priceTier: null };
}

export async function POST() {
  try {
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
      const result = await model.generateContent(
        JSON.stringify(payloadToProcess),
      );
      let rawContent = result.response.text() || "[]";

      rawContent = rawContent
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();
        
      // --- THE NEW SAFE PARSING BLOCK ---
      let batchResults;
      try {
        batchResults = JSON.parse(rawContent);
      } catch (parseError) {
        console.error("FAILED TO PARSE AI JSON. The raw string was:");
        console.error(rawContent);
        
        // Mark items as failed so they don't get stuck pending forever
        for (const item of pendingItems) {
          await db.inspirationItem.update({
            where: { id: item.id },
            data: { status: "failed_extraction" },
          });
          failCount++;
        }
        
        return NextResponse.json(
          { error: "AI returned malformed JSON data.", failCount },
          { status: 500 }
        );
      }
      // ----------------------------------

      for (const resultItem of batchResults) {
        const aiData = resultItem.extractedData;

        // Pass ONLY the name and city to Google to do the heavy lifting
        const googleData = await fetchPlaceData(
          aiData.businessName,
          aiData.city,
        );

        // HYBRID FALLBACK: Use Google's price. If Google says null, use the AI's guess!
        const finalPriceTier = googleData.priceTier || aiData.priceTier || null;

        // Merge the AI's vibe tags with Google's factual data
        const finalMetadata = {
          businessName: aiData.businessName,
          city: aiData.city,
          vibeTags: aiData.vibeTags,
          address: googleData.address,
          priceTier: finalPriceTier,
        };

        await db.inspirationItem.update({
          where: { id: resultItem.id },
          data: {
            rawMetadata: finalMetadata,
            latitude: googleData.lat,
            longitude: googleData.lng,
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