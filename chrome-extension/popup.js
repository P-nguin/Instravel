document.getElementById("exportBtn").addEventListener("click", async () => {
  const statusEl = document.getElementById("status");
  statusEl.innerText = "Scanning page...";
  statusEl.className = "";

  // 1. Get the active Instagram tab
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (!tab.url.includes("instagram.com")) {
    statusEl.innerText = "Error: Please navigate to Instagram.";
    statusEl.className = "error";
    return;
  }

  // 2. Execute the scraper function on that tab
  chrome.scripting.executeScript(
    {
      target: { tabId: tab.id },
      function: scrapeInstagramReels,
    },
    async (injectionResults) => {
      const reels = injectionResults[0].result;

      if (!reels || reels.length === 0) {
        statusEl.innerText =
          "No reels found on screen. Make sure you are in a saved folder.";
        statusEl.className = "error";
        return;
      }

      statusEl.innerText = `Found ${reels.length} reels. Sending to DB...`;

      // 3. Send the data to your local Next.js API
      let successCount = 0;
      let failCount = 0;

      // TODO: Paste a valid trip ID from your local database here!
      const TARGET_TRIP_ID = "cmq78a7bq0002s6m466qqg0up";

      for (const reel of reels) {
        try {
          const response = await fetch(
            "http://localhost:3000/api/inspiration-items",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                tripId: TARGET_TRIP_ID,
                sourceType: "instagram_reel",
                sourcePlatform: "instagram",
                sourceUrl: reel.url,
                description: reel.altText, // Storing the caption in the description field
                rawMetadata: { scrapedAt: new Date().toISOString() },
              }),
            },
          );

          if (response.ok) {
            successCount++;
          } else {
            failCount++;
            console.error("Server error:", await response.text());
          }
        } catch (err) {
          failCount++;
          console.error(
            "Failed to send reel. Is Next.js running on port 3000?",
            err,
          );
        }
      }

      // 4. Update the UI with the final result
      if (failCount > 0) {
        statusEl.innerText = `Done: ${successCount} saved, ${failCount} failed. Check console.`;
        if (successCount === 0) statusEl.className = "error";
      } else {
        statusEl.innerText = `Success! ${successCount} reels synced to Scout.`;
      }
    },
  );
});

// ---------------------------------------------------------
// This function runs INSIDE the active Instagram web page
// ---------------------------------------------------------
function scrapeInstagramReels() {
  const reelsData = [];
  // Instagram frequently changes class names, but hrefs to reels are consistent
  const links = document.querySelectorAll('a[href*="/reel/"]');

  links.forEach((link) => {
    // Attempt to grab any alt text or image description (often contains the caption)
    const img = link.querySelector("img");
    const altText = img ? img.alt : "";

    // Prevent adding the same video twice
    if (!reelsData.some((r) => r.url === link.href)) {
      reelsData.push({
        url: link.href,
        altText: altText,
      });
    }
  });

  return reelsData;
}
