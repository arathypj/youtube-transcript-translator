document.addEventListener('DOMContentLoaded', () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0].id) {
            // Connect to the content script in the active tab
            const port = chrome.tabs.connect(tabs[0].id, { name: "connect-translator" });

            // Listen for messages from the content script

            const inputData = document.querySelector('#inputData');
            const outputArea = document.querySelector('#outputArea');
            let transcriptSegment;
            
            port.onMessage.addListener((message) => {
                console.log("Content script: ", message);

                if (message.type ==="transcriptFetched") {
                    transcriptSegment = message.text;
                } else if (message.type === "timeUpdate") {
                    const currentSegment = findCurrentTranscriptSegemnt(message.time);
                    inputData.textContent = currentSegment;
                    translateContent(currentSegment)
                        .then(content => {
                            console.log(content);
                            outputArea.textContent = content;
                        }); 
                }

                function findCurrentTranscriptSegemnt(currentTime) {
                    if (typeof transcriptSegment === "undefined") {
                        console.log("timeupdate first, have not received the data yet.")
                        return;
                    }
                    for (const data of transcriptSegment) {
                        if (currentTime <= data.transcriptTime){
                            console.log("Found the current segment "+ data.transcript);
                            return data.transcript;
                        }
                    }
                }
                
                
            });

            // Optional: Send a message to grab the transcript.
            port.postMessage({ action: "transcriptFetch" });
        }
    });
});

async function translateContent(content) {
    const languagePair = {
        sourceLanguage: 'en',
        targetLanguage: 'hi',
    };
      
    const canTranslate = await translation.canTranslate(languagePair);
    let translator;
    if (canTranslate !== 'no') {
        if (canTranslate === 'readily') {
            // The translator can immediately be used.
            translator = await translation.createTranslator(languagePair);
            
        } else {
            // The translator can be used after the model download.
            translator = await translation.createTranslator(languagePair);
            translator.addEventListener('downloadprogress', (e) => {
            console.log(e.loaded, e.total);
            });
            await translator.ready;
        }
    } else {
        // The translator can't be used at all.
    }
    const translatedLanguage = await translator.translate(content);
    console.log(translatedLanguage);
    return translatedLanguage;
}



