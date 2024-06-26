// background.js

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
  if (message.action === "closeCurrentTab") {
    // Close the current tab
    chrome.tabs.remove(sender.tab.id, function() {
        sendResponse({ success: true });
    });
    // Return true to indicate that we will respond asynchronously
    return true;
}
});
