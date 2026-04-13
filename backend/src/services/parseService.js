// src/services/parseService.js
// AI-powered parsing using Google Gemini to extract structured snapshot data from raw text.

const { GoogleGenerativeAI } = require("@google/generative-ai");

// Initialize Gemini with API key from environment
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Parse raw user input into structured snapshot fields using Gemini AI.
 * @param {string} rawText - The raw text input from the user
 * @returns {Promise<{name: string, notes: string, tags: string[], urls: string[]}>}
 */
async function parseSnapshotInput(rawText) {
  // Fallback response in case of any errors
  const fallback = {
    name: rawText.slice(0, 80),
    notes: "",
    tags: [],
    urls: [],
  };

  try {
    // Get the Gemini model
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

    // Build the prompt instructing Gemini to extract structured data
    const prompt = `Extract structured snapshot information from the following text.

Return ONLY a raw JSON object with these fields (no markdown fences, no explanation, no preamble):
- name (string, required): The main task name or title, maximum 80 characters
- notes (string): Any context, blockers, next steps, or additional details mentioned
- tags (array of strings): Topics, labels, or categories found in the text
- urls (array of strings): Any URLs found verbatim in the text

Text to parse:
${rawText}

Return only the JSON object:`;

    // Call Gemini API
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    // Strip any accidental markdown code fences
    let cleanedText = responseText.trim();
    if (cleanedText.startsWith("```json")) {
      cleanedText = cleanedText.slice(7);
    } else if (cleanedText.startsWith("```")) {
      cleanedText = cleanedText.slice(3);
    }
    if (cleanedText.endsWith("```")) {
      cleanedText = cleanedText.slice(0, -3);
    }
    cleanedText = cleanedText.trim();

    // Parse the JSON response
    const parsed = JSON.parse(cleanedText);

    // Validate and normalize the response
    return {
      name:
        typeof parsed.name === "string"
          ? parsed.name.slice(0, 80)
          : fallback.name,
      notes: typeof parsed.notes === "string" ? parsed.notes : "",
      tags: Array.isArray(parsed.tags) ? parsed.tags : [],
      urls: Array.isArray(parsed.urls) ? parsed.urls : [],
    };
  } catch (error) {
    // On any error, return the safe fallback
    console.error("parseSnapshotInput error:", error.message);
    return fallback;
  }
}

module.exports = {
  parseSnapshotInput,
};
