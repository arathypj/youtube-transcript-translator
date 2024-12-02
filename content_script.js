/**
 * Retrieves the transcript text from the video along with its associated timestamps.
 * 
 * @returns {Promise<Array>} A promise that resolves to an array of transcript objects containing
 *                           the text and time for each transcript entry.
 * @throws {Error} If the "Show transcript" button is not found, or the transcript 
 *                 cannot be fetched properly.
 */
async function getTranscript() {
  try {
    // Find the "Show transcript" button on the page
    let transcriptButton = findTranscriptShowButton("Show transcript");
    if (!transcriptButton) {
      throw new Error("The 'Show transcript' button was not found on the page.");
    }
    
    // Click the "Show transcript" button to reveal the transcript
    transcriptButton.click();

    // Wait for 1 second to give time for the transcript to load
    await new Promise(resolve => setTimeout(resolve, 1000));

    const transcriptObjects = getAllTranscriptTextWithTime();

    if (!transcriptObjects || transcriptObjects.length === 0) {
      throw new Error("Failed to fetch transcript data. The transcript may not have loaded.");
    }

    return transcriptObjects;

  } catch (error) {
    console.error("Error occurred while fetching the transcript:", error);
    throw error;
  }
}


function findTranscriptShowButton(label) {
  try {
    // Select all button elements on the page
    const buttons = document.querySelectorAll('button');

    // Filter buttons by aria-label attribute
    const matchingButtons = Array.from(buttons)
      .filter(button => button.getAttribute('aria-label') === label);

    // If no matching button is found, throw an error
    if (matchingButtons.length === 0) {
      throw new Error(`Button with label ${label}" not found.`);
    }

    // Return the first matching button
    return matchingButtons[0];

  } catch (error) {
    console.error("Error finding transcript button:", error.message);
    throw error;
  }
}

/**
 * Extracts all transcript text along with their corresponding timestamps from the youtube page.
 * 
 * @returns {Array<{transcript: string, transcriptTime: string}>} An array of objects, each containing 
 *          a transcript text and its corresponding timestamp.
 * @throws {Error} If no transcript elements are found or if the required text 
 *                 elements are missing from any transcript segment.
 */
function getAllTranscriptTextWithTime() {
  try {
    const transcriptElements = document.querySelectorAll('ytd-transcript-segment-renderer');

    if (transcriptElements.length === 0) {
      throw new Error("No transcript elements found on the page.");
    }

    // Map through the elements to extract transcript and timestamp
    const transcriptWithTimeObject = Array.from(transcriptElements).map(domElement => {
      const timestampElement = domElement.querySelectorAll('div.segment-timestamp')[0];
      const transcriptElement = domElement.querySelectorAll('yt-formatted-string')[0];

      // Check if the required elements are missing
      if (!timestampElement || !transcriptElement) {
        throw new Error("Missing timestamp or transcript text in one of the segments.");
      }

      const timestamp = timestampElement.textContent.trim();
      const transcriptText = transcriptElement.textContent.trim();
      
      return { transcript: transcriptText, transcriptTime: timestamp };
    });

    return transcriptWithTimeObject;

  } catch (error) {
    console.error("Error retrieving transcript data:", error.message);
    throw error;
  }
}

const displayedTimeElement = document.getElementsByClassName("ytp-time-current");

/**
 * Handles incoming connections. When a message is received, the transcript 
 * is fetched, and time updates are sent back to the connecting port.
 *
 * @param {chrome.runtime.Port} port - The port object representing the connection to the extension.
 */
chrome.runtime.onConnect.addListener((port) => {
  let observer; // Declare observer here to access it in the disconnect handler

  if (port.name === "connect-translator") {
    console.log("Connected to translator");

    port.onMessage.addListener((message) => {
      setTimeout(async () => {
        try {
          // Attempt to fetch the transcript data
          const fetchedTranscript = await getTranscript();

          // If transcript is fetched successfully, send it to the connected port
          if (fetchedTranscript) {
            port.postMessage({ type: "transcriptFetched", text: fetchedTranscript });
          }
        } catch (error) {
          // Handle any errors in fetching the transcript
          console.error("Error fetching transcript:", error.message);
        }
      });
    });

    // Start observing time changes as soon as the popup is connected
    observeTimeChanges();

    // Disconnect observer and clear interval on port disconnect
    port.onDisconnect.addListener(() => {
      console.log('Port disconnected.');
      if (observer) {
        observer.disconnect(); // Disconnect the observer when port is disconnected
        console.log("Stopped observing time updates.");
      }
    });
  }

  function observeTimeChanges() {
    // Select the element whose text content you want to monitor
    const displayedTimeElement = document.getElementsByClassName("ytp-time-current")[0];

    if (!displayedTimeElement) {
      console.log("Time element not found!");
      return;
    }

    // Create a MutationObserver to listen for text content changes
    observer = new MutationObserver((mutationsList) => {
      for (let mutation of mutationsList) {
        // Check if the mutation is related to text content changes
        if (mutation.type === 'characterData' || mutation.type === 'childList') {
          const currentTime = displayedTimeElement.textContent;
          console.log("Updated time: " + currentTime);
          // Send updated time to popup
          port.postMessage({ type: "timeUpdate", time: currentTime });
        }
      }
    });

    // Configure the observer to watch for changes in text content (characterData)
    observer.observe(displayedTimeElement, {
      characterData: true,
      childList: true,
      subtree: true
    });
  }
});


console.log("content_script loaded");