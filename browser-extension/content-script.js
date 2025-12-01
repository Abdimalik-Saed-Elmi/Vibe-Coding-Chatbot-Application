(function () {
  // Inject bridge script into the page context
  const script = document.createElement("script");
  script.src = chrome.runtime.getURL("page-bridge.js");
  script.async = false;
  (document.head || document.documentElement).appendChild(script);
  script.onload = () => script.remove();

  window.addEventListener("message", (event) => {
    if (event.source !== window || !event.data) return;
    const message = event.data;

    if (message.source !== "ollama-cors-bridge" || message.type !== "REQUEST") {
      return;
    }

    chrome.runtime.sendMessage(message, (response) => {
      window.postMessage(
        {
          source: "ollama-cors-extension",
          requestId: message.requestId,
          success: response?.success,
          response: response?.response,
          error: response?.error,
        },
        "*"
      );
    });
  });
})();

