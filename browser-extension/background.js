const TARGET_ORIGIN = "http://localhost:11434";
const REQUEST_TIMEOUT = 20000;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || message.source !== "ollama-cors-bridge" || message.type !== "REQUEST") {
    return;
  }

  handleRequest(message.payload)
    .then((response) => sendResponse({ success: true, response }))
    .catch((error) => sendResponse({ success: false, error: error.message }));

  // Keep the message channel open for async response
  return true;
});

async function handleRequest(payload) {
  const { url, method = "POST", headers = {}, body } = payload;

  if (!url.startsWith(TARGET_ORIGIN)) {
    throw new Error("Blocked request: URL is not allowed.");
  }

  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  try {
    const response = await fetch(url, {
      method,
      headers,
      body,
      signal: controller.signal,
    });

    const textBody = await response.text();
    const responseHeaders = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });

    return {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
      body: textBody,
    };
  } finally {
    clearTimeout(id);
  }
}

