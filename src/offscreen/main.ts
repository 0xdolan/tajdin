const player = document.querySelector<HTMLAudioElement>("#player");
if (!player) {
  throw new Error("Missing #player audio element");
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === "zeng/offscreen/ping") {
    sendResponse({ ok: true, paused: player.paused });
    return true;
  }
  return false;
});
