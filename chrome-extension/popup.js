document.addEventListener('DOMContentLoaded', async () => {
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const exportBtn = document.getElementById('exportBtn');
  const statusEl = document.getElementById('status');

  if (!tab.url.includes("instagram.com")) {
    exportBtn.disabled = true;
    exportBtn.style.opacity = "0.5";
    exportBtn.style.cursor = "not-allowed";
    statusEl.innerText = "Please open Instagram to use Scout.";
    statusEl.className = "error";
  }
});

document.getElementById('exportBtn').addEventListener('click', async () => {
  const statusEl = document.getElementById('status');
  statusEl.innerText = "Auto-scrolling to find all spots... (Please wait)";
  statusEl.className = "";

  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: scrapeInstagramReels,
  }, async (injectionResults) => {
    const reels = injectionResults[0].result;
    
    if (!reels || reels.length === 0) {
      statusEl.innerText = "No spots found. Make sure you are in a saved folder.";
      statusEl.className = "error";
      return;
    }

    statusEl.innerText = `Found ${reels.length} total spots. Sending to DB...`;

    let successCount = 0;
    let failCount = 0;

    // TODO: Paste your valid trip ID here!
    const TARGET_TRIP_ID = "cmq78a7bq0002s6m466qqg0up"; 

    for (const reel of reels) {
      try {
        const response = await fetch('http://localhost:3000/api/inspiration-items', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            tripId: TARGET_TRIP_ID, 
            sourceType: "instagram_reel",
            sourcePlatform: "instagram",
            sourceUrl: reel.url,
            description: reel.altText, 
            rawMetadata: { scrapedAt: new Date().toISOString() }
          })
        });

        if (response.ok) {
          successCount++;
        } else {
          failCount++;
        }
      } catch (err) {
        failCount++;
      }
    }
    
    if (failCount > 0) {
      statusEl.innerText = `Done: ${successCount} saved, ${failCount} failed.`;
      if (successCount === 0) statusEl.className = "error";
    } else {
      statusEl.innerText = `Success! ${successCount} spots synced to Scout.`;
    }
  });
});

// ---------------------------------------------------------
// This runs INSIDE Instagram. It is now an ASYNC function.
// ---------------------------------------------------------
async function scrapeInstagramReels() {
  const reelsData = new Map(); // Using a Map to prevent duplicates
  
  // Helper function to pause the script so Instagram has time to load network requests
  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  let previousHeight = 0;
  let currentHeight = document.body.scrollHeight;

  // Keep looping as long as the page keeps getting taller
  while (true) {
    // 1. Grab everything currently visible in the DOM
    const links = document.querySelectorAll('a[href*="/reel/"], a[href*="/p/"]');
    
    links.forEach(link => {
      const img = link.querySelector('img');
      const altText = img ? img.alt : "";
      
      // Save it to the Map using the URL as the unique key
      if (!reelsData.has(link.href)) {
        reelsData.set(link.href, {
          url: link.href,
          altText: altText
        });
      }
    });

    // 2. Scroll to the absolute bottom of the page
    previousHeight = document.body.scrollHeight;
    window.scrollTo(0, document.body.scrollHeight);
    
    // 3. Wait 1.5 seconds for Instagram to fetch and draw the next batch
    await sleep(1500); 
    
    currentHeight = document.body.scrollHeight;

    // 4. If the height hasn't changed, we hit the end of the folder. Break the loop.
    if (previousHeight === currentHeight) {
      // Let's do one final check just in case it was a slow network request
      await sleep(1000);
      if (document.body.scrollHeight === currentHeight) {
        break;
      }
    }
  }

  // Convert the Map back into a clean array and return it
  return Array.from(reelsData.values());
}