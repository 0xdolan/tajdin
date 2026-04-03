chrome.runtime.onInstalled.addListener(() => {
  // Install / update hook (alarms, defaults) — expand in audio-engine task.
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === "zeng/health-check") {
    sendResponse({ ok: true });
    return true;
  }
  return false;
});
