let overlayDisplayed = false;
chrome.storage.local.get(['focusMode', 'blockedSites', 'blockMode'], (data) => {
    const { focusMode, blockedSites, blockMode } = data;
    if (focusMode && blockedSites) {
        const currentUrl = (new URL(window.location.href)).hostname.replace(/^www\./, '');
        if (blockedSites.includes(currentUrl)) {
            showOverlay(blockMode);
        } else {
            hideOverlay();
        }
    } else {
        hideOverlay(); // If focusMode is false or blockedSites is not yet initialized
    }
});

console.log('CONTENT JS INJECTED');
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'toggleFocusMode') {
        console.log('HELLO');
        const newFocusMode = message.focusMode;
        chrome.storage.local.get(['blockedSites', 'blockMode'], (data) => {
            const blockedSites = data.blockedSites || [];
            const blockMode = data.blockMode;
            const currentUrl = (new URL(window.location.href)).hostname.replace(/^www\./, '');

            if (newFocusMode && blockedSites.includes(currentUrl)) {
                showOverlay(blockMode);
            } else if (!newFocusMode && blockedSites.includes(currentUrl)) {
                hideOverlay();
            }
        });
    }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    const currentUrl = (new URL(window.location.href)).hostname.replace(/^www\./, '');
    if (message.action === 'getCurrentUrl') {
        console.log(currentUrl);
        sendResponse({ url: currentUrl });
    }
    if (message.action === 'removeUrl') {
        const newFocusMode = message.focusMode;
        const receivedUrl = message.site;
        const mode = message.mode;
        console.log(newFocusMode);
        console.log(receivedUrl);
        if (newFocusMode && receivedUrl === currentUrl) {
            hideOverlay(mode);
        }
    }
    if (message.action === 'addUrl') {
        const newFocusMode = message.focusMode;
        const receivedUrl = message.site;
        const mode = message.mode;
        console.log(newFocusMode);
        console.log(receivedUrl);
        if (newFocusMode && receivedUrl === currentUrl) {
            showOverlay(mode);
        }
    }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'refreshTab' && overlayDisplayed) {
        location.reload(); // Reload the tab if overlay is displayed
    }
});
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'applyBlockMode') {
        const mode = message.mode;
        const newFocusMode = message.focusMode;
        chrome.storage.local.get('blockedSites', (data) => {
            const blockedSites = data.blockedSites || [];
            const currentUrl = (new URL(window.location.href)).hostname.replace(/^www\./, '');

            if (newFocusMode && blockedSites.includes(currentUrl)) {
                showOverlay(mode);
                console.log('AAAAAAAAAAAAAA');
            }
        });
    }
});
function showOverlay(mode) {
    console.log(mode);
    switch (mode) {
        case 1:
            displayOverlay();
            break;
        case 2:
            closeTabs();
            break;
        default:
            console.error('Invalid block mode');
    }
}
function displayOverlay() {
    if (!overlayDisplayed) {
        overlayDisplayed = true;
        if (!document.getElementById('focus-overlay')) {
            const overlay = document.createElement('div');
            overlay.id = 'focus-overlay';
            overlay.style.position = 'fixed';
            overlay.style.top = '0';
            overlay.style.left = '0';
            overlay.style.width = '100%';
            overlay.style.height = '100%';
            overlay.style.backgroundColor = 'rgba(0, 0, 0)';
            overlay.style.color = 'rgba(200, 200, 200, 0.9)';
            overlay.style.display = 'flex';
            overlay.style.justifyContent = 'center';
            overlay.style.alignItems = 'center';
            overlay.style.fontFamily = 'sans-serif';
            overlay.style.fontSize = '19px';
            overlay.style.textDecoration = 'underline';
            overlay.style.textUnderlineOffset = '3px';
            overlay.style.zIndex = '9999';
            overlay.innerText = 'focus.';

            document.body.innerHTML = '';
            document.title = 'focus.';
            document.body.appendChild(overlay);
            document.documentElement.style.overflow = 'hidden'; // Disable scrolling

        }
    }
}
function closeTabs() {
    chrome.runtime.sendMessage({ action: 'closeCurrentTab' }, function (response) {
        if (response && response.success) {
            console.log("Tab closed successfully.");
        } else {
            console.error("Failed to close the tab.");
        }
    });
}
function hideOverlay() {
    if (overlayDisplayed) {
        overlayDisplayed = false;
        const overlay = document.getElementById('focus-overlay');
        if (overlay) {
            location.reload();
        }
    }
}
