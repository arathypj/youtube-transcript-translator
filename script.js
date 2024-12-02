document.addEventListener('DOMContentLoaded', () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0].id) {
            // Connect to the content script in the active tab
            const port = chrome.tabs.connect(tabs[0].id, { name: "connect-translator" });

            // Listen for messages from the content script

            const inputData = document.querySelector('#inputData');
            const outputArea = document.querySelector('#outputArea');
            const errorMessage = document.querySelector('#errorMessage');
            let transcriptSegment;
            
            port.onMessage.addListener((message) => {
                console.log("Content script: ", message);
                try {
                    if (message.type ==="transcriptFetched") {
                        transcriptSegment = message.text;
                    } else if (message.type === "timeUpdate") {
                        const currentSegment = findCurrentTranscriptSegemnt(message.time);
    
                        // to display the current transcript 
                        // inputData.textContent += currentSegment;
    
                        //translate the current transcript segment
                        translateContent(currentSegment)
                            .then(content => {
                                console.log(content);
                                outputArea.textContent = content;
                            }); 
                    }
                } catch (error) {
                    errorMessage.textContent = error.message;
                    errorMessage.classList.add("show");
                }

                /**
                 * Finds the transcript segment that corresponds to the current time.
                 *
                 * @param {number} currentTime - The current time used to find the appropriate transcript segment.
                 * @returns {string} The corresponding transcript segment or undefined if not found.
                 */
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


/**
 * Translates the provided content from English to Hindi.
 * 
 * This function checks if translation is possible with the specified language pair, 
 * then either immediately uses a translator or waits for a model to download before translation.
 *
 * @async
 * @param {string} content - The text content that needs to be translated.
 * @returns {Promise<string>} A promise that resolves to the translated content.
 * @throws {Error} Throws an error if translation is not possible.
 */
async function translateContent(content) {
    const languagePair = {
        sourceLanguage: 'en',
        targetLanguage: 'hi',
    };
      
    const canTranslate = await translation.canTranslate(languagePair);
    let translator;
    if (canTranslate === 'no') {
        errorMessage.innerHTML = "Translation is not possible";
        throw new Error("Translation is not possible");
    }

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
    
    const translatedLanguage = await translator.translate(content);
    console.log(translatedLanguage);
    return translatedLanguage;
}