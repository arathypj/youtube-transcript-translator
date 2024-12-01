async function getTranscript() {
  let transcriptButton = findTranscriptShowButton("Show transcript");
  transcriptButton.click();

  await new Promise(resolve => setTimeout(resolve, 1000));

  const transcriptObjects = getAllTranscriptTextWithTime();

  return transcriptObjects;
}


function findTranscriptShowButton(label) {
  const buttons = document.querySelectorAll('button');

  const matchingButtons = Array.from(buttons)
      .filter(button => button.getAttribute('aria-label') === label);

  return matchingButtons[0];
}

function getAllTranscriptTextWithTime() {
  const transcriptElements = document.querySelectorAll('ytd-transcript-segment-renderer');
  const transcriptWithTimeObject = Array.from(transcriptElements).map(domElement => {
    const timestamp = domElement.querySelectorAll('div.segment-timestamp')[0].textContent.trim();
    const transcriptText = domElement.querySelectorAll('yt-formatted-string')[0].textContent.trim();
    return {transcript: transcriptText, transcriptTime: timestamp};
  });
  return transcriptWithTimeObject;
}

const displayedTimeElement = document.getElementsByClassName("ytp-time-current");

chrome.runtime.onConnect.addListener((port) => {
  let observer; // Declare observer here to access it in the disconnect handler

  if (port.name === "connect-translator") {
    console.log("Connected to translator");

    port.onMessage.addListener((message) => {
      setTimeout(async () => {
        const fetchedTranscript = await getTranscript();

        if (fetchedTranscript) {
          port.postMessage({ type: "transcriptFetched", text: fetchedTranscript });
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
      characterData: true,  // Watch for text changes
      childList: true,      // Watch for child nodes being added/removed (if needed)
      subtree: true         // Watch the entire subtree of the element (optional)
    });
  }
});


console.log("content_script loaded");