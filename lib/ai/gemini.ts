import { ExtractedMedicine } from "../types";

// Models to try in order — falls back if one is quota-exhausted
const GEMINI_MODELS = [
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-2.0-flash-lite",
];

const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

const EXTRACTION_PROMPT = `You are reading a printed Indian medical prescription. Extract ONLY the list of medicines prescribed.

For each medicine, return:
- name: the medicine name as written (e.g. "Telma 40", "Glycomet 500")
- composition: the active salt(s) and strength if you can infer it (e.g. "Telmisartan 40mg")
- confidence: "high" if clearly printed, "low" if unclear

Ignore: doctor info, patient info, diagnosis, dosing instructions, dates, signature, hospital letterhead.

If the prescription appears handwritten or unreadable, return an empty medicines array with a note.

Return STRICTLY this JSON structure, nothing else:
{
  "medicines": [
    { "name": "string", "composition": "string", "confidence": "high" | "low" }
  ],
  "rawText": "any text you could read from the prescription"
}`;

export interface ExtractionResult {
  medicines: ExtractedMedicine[];
  rawText: string;
}

export interface ExtractionError {
  error: string;
  code: string;
}

export async function extractPrescription(
  imageBase64: string
): Promise<ExtractionResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw { error: "Gemini API key not configured", code: "AI_NOT_CONFIGURED" } as ExtractionError;
  }

  // Detect mime type from base64 header or default to jpeg
  let mimeType = "image/jpeg";
  let cleanBase64 = imageBase64;
  if (imageBase64.startsWith("data:")) {
    const match = imageBase64.match(/^data:(image\/\w+);base64,/);
    if (match) {
      mimeType = match[1];
      cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, "");
    }
  }

  const requestBody = {
    contents: [
      {
        parts: [
          { text: EXTRACTION_PROMPT },
          {
            inlineData: {
              mimeType,
              data: cleanBase64,
            },
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 2048,
    },
  };

  // Try each model in order. For each model, retry ONCE on transient errors
  // (429 quota, 5xx server) before falling through to the next model.
  // Only bail out immediately on hard client errors (400/401/403/404) — those
  // won't be fixed by trying another model.
  let data: any = null;
  let lastError: { status: number; body: string } | null = null;
  const isTransient = (s: number) => s === 429 || s >= 500;
  const isHardClientError = (s: number) =>
    s === 400 || s === 401 || s === 403 || s === 404;

  outer: for (const model of GEMINI_MODELS) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const response = await fetch(
          `${GEMINI_API_BASE}/${model}:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestBody),
          }
        );

        if (response.ok) {
          data = await response.json();
          console.log(`[Gemini] Used model: ${model} (attempt ${attempt + 1})`);
          break outer;
        }

        const bodyText = await response.text().catch(() => "");
        lastError = { status: response.status, body: bodyText };

        if (isHardClientError(response.status)) {
          // Auth/permission/model-not-found — fallback won't help
          console.warn(`[Gemini] Hard error ${response.status} on ${model}, aborting`);
          break outer;
        }

        if (isTransient(response.status) && attempt === 0) {
          // One retry with short backoff before falling through to next model
          console.warn(`[Gemini] Transient ${response.status} on ${model}, retrying in 600ms…`);
          await new Promise((r) => setTimeout(r, 600));
          continue;
        }

        // Already retried once — try the next model
        console.warn(`[Gemini] ${model} failed with ${response.status}, falling through`);
        break;
      } catch (err) {
        lastError = { status: 0, body: String(err) };
        if (attempt === 0) {
          await new Promise((r) => setTimeout(r, 600));
          continue;
        }
        break;
      }
    }
  }

  if (!data) {
    throw {
      error: `Gemini API failed: ${lastError?.status} ${lastError?.body?.slice(0, 200) || ""}`,
      code: lastError?.status === 429 ? "AI_QUOTA_EXHAUSTED" : "AI_DOWN",
    } as ExtractionError;
  }

  // Extract text content from Gemini response
  const textContent =
    data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

  if (!textContent) {
    throw { error: "Gemini returned empty response", code: "AI_PARSE_ERROR" } as ExtractionError;
  }

  // Parse JSON from the response (may be wrapped in markdown code blocks)
  let parsed: ExtractionResult;
  try {
    const jsonStr = textContent
      .replace(/```json\s*/g, "")
      .replace(/```\s*/g, "")
      .trim();
    parsed = JSON.parse(jsonStr);
  } catch (err) {
    throw {
      error: "Could not parse Gemini response as JSON",
      code: "AI_PARSE_ERROR",
    } as ExtractionError;
  }

  // Validate structure
  if (!parsed.medicines || !Array.isArray(parsed.medicines)) {
    return { medicines: [], rawText: parsed.rawText || textContent };
  }

  // Normalize confidence values
  parsed.medicines = parsed.medicines.map((m) => ({
    name: m.name || "",
    composition: m.composition || "",
    confidence: m.confidence === "low" ? "low" : "high",
  }));

  return {
    medicines: parsed.medicines,
    rawText: parsed.rawText || "",
  };
}
