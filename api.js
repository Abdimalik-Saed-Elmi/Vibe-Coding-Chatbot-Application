/**
 * API Configuration and Functions for Ollama Chat Integration
 *
 * This file contains the API function that can be easily integrated into any chat UI.
 * It uses the Fetch API to communicate with the Ollama API.
 */

// API Configuration
const OLLAMA_API_URL = "http://localhost:11434/api/generate";
const DEFAULT_MODEL = "deepseek-r1:1.5b";

/**
 * Detects if running from file:// protocol (which causes CORS issues)
 * @returns {boolean} True if running from file://
 */
function isFileProtocol() {
  return typeof window !== "undefined" && window.location.protocol === "file:";
}

/**
 * Sends a message to the Ollama API and returns the response
 *
 * @param {string} prompt - The user's question/prompt
 * @param {Object} options - Optional configuration
 * @param {string} options.model - The model to use (default: "deepseek-r1:1.5b")
 * @param {boolean} options.stream - Whether to stream the response (default: false)
 * @param {string} options.apiUrl - Custom API URL (default: "http://localhost:11434/api/generate")
 * @returns {Promise<Object>} The API response containing the model's answer
 *
 * @example
 * const response = await sendMessageToOllama("Why is the sky blue?");
 * console.log(response.response); // The AI's answer
 */
async function sendMessageToOllama(prompt, options = {}) {
  const {
    model = DEFAULT_MODEL,
    stream = false,
    apiUrl = OLLAMA_API_URL,
  } = options;

  try {
    const requestBody = JSON.stringify({
      model: model,
      prompt: prompt,
      stream: stream,
    });

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: requestBody,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    // Enhanced error handling for CORS issues
    if (
      error.message.includes("Failed to fetch") ||
      error.name === "TypeError" ||
      (typeof error.message === "string" && error.message.includes("CORS"))
    ) {
      const isFile = isFileProtocol();
      let errorMsg = "CORS Error: Browser blocked the request.\n\n";

      if (isFile) {
        errorMsg += "You're opening this file directly (file://). ";
      }

      errorMsg += "Solutions:\n";
      errorMsg += "1. Load the bundled 'Ollama CORS Helper' browser extension\n";
      errorMsg += "2. Launch Chrome with --disable-web-security flag (dev only)\n";
      errorMsg += "3. Serve via HTTP (php -S localhost:8000) or enable CORS on Ollama";

      const corsError = new Error(errorMsg);
      corsError.name = "CORSError";
      throw corsError;
    }

    console.error("Error sending message to Ollama:", error);
    throw error;
  }
}

// Export for use in modules (if using ES6 modules)
if (typeof module !== "undefined" && module.exports) {
  module.exports = { sendMessageToOllama, OLLAMA_API_URL, DEFAULT_MODEL };
}
