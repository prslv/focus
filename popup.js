/*
MIT License with Additional Restrictions and Disclaimer

Copyright (c) 2024 Preslav Kunov, repuddle.com

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

1. The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

2. The Software, or any derivative works thereof, may not be used for commercial purposes, including but not limited to the sale of the Software, integration into commercial products, or for any use that generates monetary gain.

3. The Software, or any derivative works thereof, may not be patented or used in any way that infringes on the intellectual property rights of the original author.

4. Any modifications made to the Software must be clearly indicated, and the original copyright notice and permission notice shall be retained in the derivative works.

5. Redistributions of the Software, modified or unmodified, must reproduce the above copyright notice, this list of conditions, and the following disclaimer in the documentation and/or other materials provided with the distribution.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/
document.addEventListener('DOMContentLoaded', () => {
    const toggleFocusButton = document.getElementById('toggleFocus');
    const addSiteButton = document.getElementById('addSite');
    const addCurrentSiteButton = document.getElementById('addCurrentSite');
    const siteInput = document.getElementById('siteInput');
    const blockedSitesList = document.getElementById('blockedSites');

    // initialize UI and event listeners
    chrome.storage.local.get(['focusMode', 'blockedSites', 'blockMode'], (data) => {
        if (typeof data.focusMode === 'undefined') {
            chrome.storage.local.set({ focusMode: false });
        }
        if (typeof data.blockMode === 'undefined') {
            chrome.storage.local.set({ blockMode: 1 });
        }
        if (!Array.isArray(data.blockedSites)) {
            chrome.storage.local.set({ blockedSites: [] });
        }
        updateUI(data.focusMode, data.blockedSites);
        console.log(data.blockMode);

        // console.log(data.focusMode);
        // console.log(data.blockedSites);
    });
    //

    //EVENT LISTENERS
    siteInput.addEventListener('input', () => {
        if (siteInput.value.trim() !== '') {
            addSiteButton.classList.remove('hidden');
        } else {
            addSiteButton.classList.add('hidden');
        }
    });

    siteInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            handleInputUrls(siteInput, addSiteButton);
        }
    })

    addSiteButton.addEventListener('click', () => {
        handleInputUrls(siteInput, addSiteButton);
    });

    toggleFocusButton.addEventListener('click', () => {
        chrome.storage.local.get(['focusMode', 'blockMode'], (data) => {
            const newFocusMode = !data.focusMode;
            const blockMode = data.blockMode;

            chrome.storage.local.set({ focusMode: newFocusMode }, () => {
                updateUI(newFocusMode, null); // update UI

                // send message to all tabs to toggle focus mode
                chrome.tabs.query({}, (tabs) => {
                    tabs.forEach((tab) => {
                        chrome.tabs.sendMessage(tab.id, { action: 'toggleFocusMode', mode: blockMode, focusMode: newFocusMode }, (response) => {
                            if (chrome.runtime.lastError) {
                                // console.error('Error sending message: ' + chrome.runtime.lastError.message);
                            }
                        });
                    });
                });
            });
        });
    });

    addCurrentSiteButton.addEventListener('click', () => {
        chrome.storage.local.get(['focusMode', 'blockMode'], (data) => {
            const newFocusMode = data.focusMode;
            const blockMode = data.blockMode;
            // console.log(data);
            let returnedUrl = '';
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                chrome.tabs.sendMessage(tabs[0].id, { action: "getCurrentUrl" }, (response) => {
                    if (response) {
                        returnedUrl = response.url;
                        addNewSite(returnedUrl);
                        if (newFocusMode) {
                            chrome.tabs.query({}, (tabs) => {
                                tabs.forEach((tab) => {
                                    chrome.tabs.sendMessage(tab.id, { action: "addUrl", mode: blockMode, focusMode: newFocusMode, site: returnedUrl }, (response) => {
                                        if (chrome.runtime.lastError) {
                                            // console.error('Error sending message: ' + chrome.runtime.lastError.message);
                                        }
                                    });
                                });
                            });
                        }
                    }
                    if (chrome.runtime.lastError) {
                        console.error('Error sending message: ' + chrome.runtime.lastError.message);
                    }
                });
            });
        });
    });

    blockedSitesList.addEventListener('click', (event) => {
        if (event.target.classList.contains('remove-site')) {
            const siteToRemove = event.target.dataset.site;
            chrome.storage.local.get('blockedSites', (data) => {
                const blockedSites = data.blockedSites || [];
                const updatedBlockedSites = blockedSites.filter(site => site !== siteToRemove);
                chrome.storage.local.set({ blockedSites: updatedBlockedSites }, () => {
                    updateUI(null, updatedBlockedSites);

                    chrome.storage.local.get(['focusMode', 'blockMode'], (data) => {
                        const newFocusMode = data.focusMode;
                        const blockMode = data.blockMode;
                        if (newFocusMode) {
                            chrome.tabs.query({}, (tabs) => {
                                tabs.forEach((tab) => {
                                    chrome.tabs.sendMessage(tab.id, { action: "removeUrl", focusMode: newFocusMode, mode: blockMode, site: siteToRemove }, (response) => {
                                        if (chrome.runtime.lastError) {
                                            // console.error('Error sending message: ' + chrome.runtime.lastError.message);
                                        }
                                    });
                                    // console.log(siteToRemove);
                                });
                            });
                        }
                    });
                });
            });
        }
    });
    //

    // SET BLOCKING MODE (CLOSE TABS / DISPLAY OVERLAY)
    const mode1Radio = document.getElementById('mode1Radio');
    const mode2Radio = document.getElementById('mode2Radio');

    chrome.storage.local.get('blockMode', (data) => {
        if (data.blockMode === 2) {
            mode2Radio.checked = true;
        } else {
            mode1Radio.checked = true;
        }
    });

    mode1Radio.addEventListener('change', () => {
        if (mode1Radio.checked) {
            chrome.storage.local.set({ blockMode: 1 });
            applyBlockMode(1);
            // console.log('mode 1 checked');
        }
    });

    mode2Radio.addEventListener('change', () => {
        if (mode2Radio.checked) {
            chrome.storage.local.set({ blockMode: 2 });
            applyBlockMode(2);
            // console.log('mode 2 checked');
        }
    });
    //

    // FUNCTIONS
    function handleInputUrls(input, addbtn) {
        const newSite = input.value.trim().toLowerCase();
        if (newSite) {
            addNewSite(newSite);
            addbtn.classList.add('hidden');

            chrome.storage.local.get(['focusMode', 'blockMode'], (data) => {
                const newFocusMode = data.focusMode;
                const blockMode = data.blockMode;

                if (newFocusMode) {
                    chrome.tabs.query({}, (tabs) => {
                        tabs.forEach((tab) => {
                            chrome.tabs.sendMessage(tab.id, { action: "addUrl", mode: blockMode, focusMode: newFocusMode, site: newSite }, (response) => {
                                if (chrome.runtime.lastError) {
                                    // console.error('Error sending message: ' + chrome.runtime.lastError.message);
                                }
                            });
                        });
                    });
                }
            });
        }
        siteInput.value = '';
    }
    function addNewSite(newSite) {
        chrome.storage.local.get('blockedSites', (data) => {
            const blockedSites = data.blockedSites || [];
            if (!blockedSites.includes(newSite)) {
                blockedSites.push(newSite);
                chrome.storage.local.set({ blockedSites: blockedSites }, () => {
                    updateUI(null, blockedSites);
                });
            }
        });
    }
    function applyBlockMode(mode) {
        chrome.storage.local.get('focusMode', (data) => {
            const newFocusMode = data.focusMode;
            chrome.tabs.query({}, (tabs) => {
                tabs.forEach((tab) => {
                    chrome.tabs.sendMessage(tab.id, { action: 'applyBlockMode', mode: mode, focusMode: newFocusMode }, (response) => {
                        if (chrome.runtime.lastError) {
                            // console.error('Error: ' + chrome.runtime.lastError.message);
                        }
                    });
                });
            });
        });
    }
    function updateUI(focusMode, blockedSites) {
        const toggleFocusButton = document.getElementById('toggleFocus');
        if (focusMode !== null) {
            const innerBtn = toggleFocusButton.querySelector('.inner-btn');
            const statusSpan = toggleFocusButton.querySelector('.status');

            if (focusMode) {
                // If focusMode is true, set classes and text for ON state
                innerBtn.classList.remove('false');
                innerBtn.classList.add('true');
                toggleFocusButton.classList.remove('off');
                toggleFocusButton.classList.add('on');
                statusSpan.textContent = 'ON';
                document.body.classList.add('body-on');
            } else {
                // If focusMode is false, set classes and text for OFF state
                innerBtn.classList.remove('true');
                innerBtn.classList.add('false');
                toggleFocusButton.classList.remove('on');
                toggleFocusButton.classList.add('off');
                statusSpan.textContent = 'OFF';
                document.body.classList.remove('body-on');
            }
        }
        if (blockedSites !== null) {
            blockedSitesList.innerHTML = '';
            blockedSites.forEach((site) => {
                const li = document.createElement('li');
                const p = document.createElement('p');
                p.textContent = site;
                const removeButton = document.createElement('span');
                removeButton.innerHTML = `<svg width="23px" height="23px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M7 12L17 12" stroke="#db0000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path> </g></svg>`;
                li.classList.add('remove-site');
                li.dataset.site = site;
                li.appendChild(removeButton);
                li.appendChild(p);
                blockedSitesList.prepend(li);
            });
        }
    }
    //

    // function shouldApplyFocusMode(hostname, focusMode, blockedSitesList) {
    //     // Check if the hostname is in the blockedSitesList
    //     const blockedSites = Array.from(blockedSitesList.children).map(li => li.textContent);
    //     return focusMode && blockedSites.includes(hostname);
    // }
});

// EXPAND BUTTONS
const supBtn = document.getElementById("expand-btn");
const supDiv = document.querySelector(".expand-div");

const setBtn = document.getElementById("settings-btn");
const setDiv = document.querySelector(".settings-div");

supBtn.addEventListener("click", () => {
    const expandSvg = document.querySelector(".expand-svg");
    const showText = document.querySelector(".show-text");
    supDiv.classList.toggle("expand");

    const setSvg = document.querySelector(".settings-svg");

    if (supDiv.classList.contains("expand")) {
        showText.textContent = 'Hide';
        supBtn.classList.add("expanded");
        setDiv.classList.remove("expand");
        expandSvg.setAttribute("transform", "rotate(90)");

        setSvg.setAttribute("transform", "rotate(-90)");
        setBtn.classList.remove("expanded");
    } else {
        expandSvg.setAttribute("transform", "rotate(-90)");
        showText.textContent = 'Show';
        supBtn.classList.remove("expanded");
    }
});

setBtn.addEventListener("click", () => {
    const expandSvg = document.querySelector(".settings-svg");

    const linksSvg = document.querySelector(".expand-svg");
    const showText = document.querySelector(".show-text");
    setDiv.classList.toggle("expand");

    if (setDiv.classList.contains("expand")) {
        setBtn.classList.add("expanded");
        expandSvg.setAttribute("transform", "rotate(90)");

        supDiv.classList.remove("expand");
        linksSvg.setAttribute("transform", "rotate(-90)");
        supBtn.classList.remove("expanded");
        showText.textContent = 'Show';

    } else {
        expandSvg.setAttribute("transform", "rotate(-90)");
        // showText.textContent = 'Show';
        setBtn.classList.remove("expanded");
    }
});
//

// STARS RATING
const stars = document.querySelectorAll('.star');
function setRating(value) {
    localStorage.setItem('userRating', value);
}

function getRating() {
    return localStorage.getItem('userRating');
}

function updateStars() {
    const rating = getRating();
    if (rating) {
        const value = parseInt(rating);
        stars.forEach((star, index) => {
            if (index < value) {
                star.classList.add('selected');
            } else {
                star.classList.remove('selected');
            }
        });
    }
}

updateStars();

stars.forEach((star) => {
    star.addEventListener('mouseenter', function () {
        const value = parseInt(this.getAttribute('data-value'));
        stars.forEach((s, index) => {
            if (index < value) {
                s.classList.add('hovered');
            } else {
                s.classList.remove('hovered');
            }
        });
    });

    star.addEventListener('mouseleave', function () {
        stars.forEach((s) => {
            s.classList.remove('hovered');
        });
        updateStars();
    });

    star.addEventListener('click', function () {
        const value = parseInt(this.getAttribute('data-value'));
        setRating(value);
        updateStars();
    });
});
//