// Run this check as soon as the popup opens
document.addEventListener("DOMContentLoaded", async () => {
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const exportBtn = document.getElementById("exportBtn");
  const statusEl = document.getElementById("status");

  // If the user is not on Instagram, disable the button
  if (!tab.url.includes("instagram.com")) {
    exportBtn.disabled = true;
    exportBtn.style.opacity = "0.5";
    exportBtn.style.cursor = "not-allowed";
    statusEl.innerText = "Please open Instagram to use Scout.";
    statusEl.className = "error";
  }
});

document.getElementById("exportBtn").addEventListener("click", async () => {
  const statusEl = document.getElementById("status");
  statusEl.innerText = "Scanning page...";
  statusEl.className = "";

  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

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

      statusEl.innerText = `Found ${reels.length} posts. Sending to DB...`;

      let successCount = 0;
      let failCount = 0;

      // TODO: Ensure your valid trip ID is pasted here!
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
                description: reel.altText,
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
  // Updated: Now looks for both /reel/ and /p/ (standard post) links
  const links = document.querySelectorAll('a[href*="/reel/"], a[href*="/p/"]');

  links.forEach((link) => {
    const img = link.querySelector("img");
    const altText = img ? img.alt : "";

    if (!reelsData.some((r) => r.url === link.href)) {
      reelsData.push({
        url: link.href,
        altText: altText,
      });
    }
  });

  return reelsData;
}
