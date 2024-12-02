chrome.tabs.onActivated.addListener(async (activeInfo) => {
  const tab = await chrome.tabs.get(activeInfo.tabId);
  displayUrl(tab.url);
  }
); 

function displayUrl(url) {
  console.log("The current tab url: " + url);
}