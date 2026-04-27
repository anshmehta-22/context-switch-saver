// src/services/parseService.js
// AI-powered parsing using Google Gemini to extract structured snapshot data from raw text.

const { GoogleGenerativeAI } = require("@google/generative-ai");

// Initialize Gemini with API key from environment
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

function clamp(str, max) {
  return String(str || "").trim().slice(0, max);
}

function normalizeWhitespace(str) {
  return String(str || "").replace(/\s+/g, " ").trim();
}

function extractHashtagTags(rawText) {
  const matches = String(rawText || "").match(/(^|\s)#([a-zA-Z0-9_-]+)/g) || [];
  const tags = matches
    .map((m) => m.replace(/^\s*#/, "").trim())
    .filter(Boolean)
    .slice(0, 8);
  return Array.from(new Set(tags));
}

function extractExplicitTags(rawText) {
  const text = String(rawText || "");
  const m = text.match(/(?:^|\n|\s)(?:tags?|labels?)\s*:\s*([^\n]+)/i);
  if (!m) return [];

  return m[1]
    .split(/[,|]/)
    .map((t) => t.replace(/^#/, "").trim())
    .filter(Boolean)
    .slice(0, 8);
}

function deriveName(rawText) {
  const text = normalizeWhitespace(rawText);
  if (!text) return "Untitled snapshot";

  const stripped = text
    .replace(/https?:\/\/\S+/gi, "")
    .replace(/(^|\s)#[a-zA-Z0-9_-]+/g, "")
    .replace(/(?:^|\s)(?:tags?|labels?)\s*:[^\n]+/gi, "")
    .trim();

  const firstChunk = stripped.split(/[.!?\n]/)[0] || stripped;
  const words = firstChunk.split(/\s+/).filter(Boolean).slice(0, 10);
  const title = words.join(" ");
  return clamp(title || text, 80);
}

function deriveNotes(rawText, name) {
  const text = normalizeWhitespace(rawText);
  if (!text) return "";
  if (!name) return text;

  const lowerText = text.toLowerCase();
  const lowerName = String(name).toLowerCase();
  if (lowerText === lowerName) return "";

  if (lowerText.startsWith(lowerName)) {
    return text.slice(name.length).replace(/^[-:,.\s]+/, "").trim();
  }

  return text;
}

function tryParseJsonObject(responseText) {
  const text = String(responseText || "").trim();
  if (!text) return null;

  // First try direct parse.
  try {
    return JSON.parse(text);
  } catch (_err) {
    // Continue with substring extraction.
  }

  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;

  const candidate = text.slice(start, end + 1).trim();
  try {
    return JSON.parse(candidate);
  } catch (_err) {
    return null;
  }
}

function normalizeParsedResult(rawText, parsed) {
  const aiName = clamp(parsed?.name, 80);
  const safeName = aiName && aiName.length >= 4 ? aiName : deriveName(rawText);

  // Reject low-quality names that are basically the full raw input.
  const rawCompact = normalizeWhitespace(rawText);
  const nameLooksLikeFullInput =
    safeName &&
    rawCompact &&
    rawCompact.length > 90 &&
    rawCompact.toLowerCase().startsWith(safeName.toLowerCase()) &&
    safeName.length > 70;

  const name = nameLooksLikeFullInput ? deriveName(rawText) : safeName;

  const notes = clamp(
    typeof parsed?.notes === "string" && parsed.notes.trim()
      ? parsed.notes
      : deriveNotes(rawText, name),
    4000,
  );

  const aiTags = Array.isArray(parsed?.tags)
    ? parsed.tags.map((t) => String(t || "").trim()).filter(Boolean)
    : [];
  const fallbackTags = [
    ...extractHashtagTags(rawText),
    ...extractExplicitTags(rawText),
  ];
  const tags = Array.from(new Set([...(aiTags.length ? aiTags : fallbackTags)]))
    .map((t) => t.replace(/^#/, "").trim())
    .filter(Boolean)
    .slice(0, 8);

  const urls = Array.isArray(parsed?.urls)
    ? parsed.urls.map((u) => String(u || "").trim()).filter(Boolean)
    : [];

  return { name, notes, tags, urls };
}

/**
 * Parse raw user input into structured snapshot fields using Gemini AI.
 * @param {string} rawText - The raw text input from the user
 * @returns {Promise<{name: string, notes: string, tags: string[], urls: string[]}>}
 */
async function parseSnapshotInput(rawText) {
  // Fallback response in case of any errors
  const fallback = normalizeParsedResult(rawText, null);

  try {
    // Get the Gemini model
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

    // Build the prompt instructing Gemini to extract structured data
    const prompt = `Extract structured snapshot information from the following text.

Return ONLY a raw JSON object with these fields (no markdown fences, no explanation, no preamble):
  - name (string, required): A short task title, maximum 80 characters. Do NOT copy the full input verbatim.
- notes (string): Any context, blockers, next steps, or additional details mentioned
- tags (array of strings): Topics, labels, or categories found in the text
- urls (array of strings): Any URLs found verbatim in the text

  Rules:
  - Prefer a concise title (about 4-10 words)
  - Put the remaining details into notes
  - If tags are hinted (hashtags, labels, topics), include them in tags

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

    // Parse and validate the JSON response.
    const parsed = tryParseJsonObject(cleanedText);
    if (!parsed || typeof parsed !== "object") {
      return fallback;
    }

    return normalizeParsedResult(rawText, parsed);
  } catch (error) {
    // On any error, return the safe fallback
    console.error("parseSnapshotInput error:", error.message);
    return fallback;
  }
}

module.exports = {
  parseSnapshotInput,
};
