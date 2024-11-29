async function detectLanguage() {
    console.log("Arathy start priniting");
    const canDetect = await translation.canDetect();
    let detector;
    if (canDetect !== 'no') {
        if (canDetect === 'readily') {
            // The language detector can immediately be used.
            detector = await translation.createDetector();
            let toTranslate = document.getElementById("dataToTranslate").innerHTML;
            console.log("detector created");
            const results = await detector.detect("This is a place in England.");
            console.log("detected language");
            let highest = 0;
            let language;
            document.getElementById("detectedLanguage").innerHTML = "This is a text in ";
            for (const result of results) {
                // Show the full list of potential languages with their likelihood
                // In practice, one would pick the top language(s) crossing a high enough threshold.
                if (result.confidence > highest) {
                    highest = result.confidence;
                    language = result.detectedLanguage;
                }
            } 
            document.getElementById("detectedLanguage").innerHTML = "This is a text in " + language;
            alert(language);            
        } else {
            // The language detector can be used after the model download.
            detector = await translation.createDetector();
            detector.addEventListener('downloadprogress', (e) => {
            alert(e.loaded, e.total);
            });
            await detector.ready;
        }
    } else {
        alert("translation not possible");
    }

}

async function translateContent() {
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
            let toTranslate = document.getElementById("dataToTranslate").innerHTML;
            const translatedLanguage = await translator.translate(toTranslate);
            console.log(translatedLanguage);
            document.getElementById("detectedLanguage").innerHTML = translatedLanguage;
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

}

document.getElementById("translate-button").addEventListener("click", detectLanguage);

