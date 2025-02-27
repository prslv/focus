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

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  // close tabs
  if (message.action === "closeCurrentTab") {
    chrome.tabs.remove(sender.tab.id, function () {
      sendResponse({ success: true });
    });
    return true;
  }

  // mute tabs
  if (message.action === "muteCurrentTab") {
    chrome.tabs.update(sender.tab.id, { muted: true });
  }
  
  // unmute tabs
  if (message.action === "unmuteCurrentTab") {
    chrome.tabs.update(sender.tab.id, { muted: false });
  }
});
