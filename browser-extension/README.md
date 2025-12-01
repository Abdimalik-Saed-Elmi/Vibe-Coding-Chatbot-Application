# Ollama CORS Helper Extension

This Chrome extension forwards `http://localhost:11434/api/generate` requests through the extension context so the browser no longer blocks them with CORS when you open `index.html` via `file://`.

## Install

1. Visit `chrome://extensions`.
2. Enable **Developer mode**.
3. Click **Load unpacked**, pick the `browser-extension` folder.
4. Open the extension details and enable **Allow access to file URLs** so it can help when you launch the page with `file://`.

## How it works

- `page-bridge.js` runs inside the page and intercepts `fetch` calls to the Ollama endpoint.
- Requests hop to the extension via `postMessage` → `content-script.js`.
- `background.js` performs the real fetch with host permissions and returns the response.

Nothing else in your app needs to change—just load the extension before opening `index.html`.

