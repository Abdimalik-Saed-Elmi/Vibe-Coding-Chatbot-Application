(function () {
  const TARGET_URL = "http://localhost:11434/api/generate";
  const originalFetch = window.fetch.bind(window);
  const pendingRequests = new Map();
  let requestCounter = 0;

  window.addEventListener("message", (event) => {
    if (event.source !== window || !event.data) return;
    const data = event.data;
    if (data.source !== "ollama-cors-extension" || !data.requestId) {
      return;
    }

    const pending = pendingRequests.get(data.requestId);
    if (!pending) return;

    pendingRequests.delete(data.requestId);

    if (!data.success) {
      pending.reject(new Error(data.error || "Extension proxy failed."));
    } else {
      pending.resolve(data.response);
    }
  });

  async function sendThroughExtension(payload) {
    const requestId = `ollama-${Date.now()}-${requestCounter++}`;

    const promise = new Promise((resolve, reject) => {
      pendingRequests.set(requestId, { resolve, reject });

      window.postMessage(
        {
          source: "ollama-cors-bridge",
          type: "REQUEST",
          requestId,
          payload,
        },
        "*"
      );

      setTimeout(() => {
        if (pendingRequests.has(requestId)) {
          pendingRequests.delete(requestId);
          reject(new Error("Extension did not respond in time."));
        }
      }, 20000);
    });

    return promise;
  }

  async function bridgeFetch(input, init = {}) {
    const url = typeof input === "string" ? input : input.url;

    if (url.startsWith(TARGET_URL)) {
      const method =
        init.method || (typeof input === "string" ? "GET" : input.method || "GET");

      const headers = new Headers(init.headers || (typeof input === "string" ? {} : input.headers || {}));
      const headerObject = {};
      headers.forEach((value, key) => {
        headerObject[key] = value;
      });

      let body = init.body;
      if (body && typeof body !== "string") {
        body = await new Response(body).text();
      }

      const proxyResponse = await sendThroughExtension({
        url,
        method,
        headers: headerObject,
        body,
      });

      return new Response(proxyResponse.body, {
        status: proxyResponse.status,
        statusText: proxyResponse.statusText,
        headers: proxyResponse.headers,
      });
    }

    return originalFetch(input, init);
  }

  window.fetch = bridgeFetch;
})();

