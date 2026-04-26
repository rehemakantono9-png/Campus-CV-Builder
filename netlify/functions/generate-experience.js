const OpenAI = require("openai");

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") {
      return jsonResponse(405, {
        success: false,
        experience_bullets: [],
        message: "Method not allowed."
      });
    }

    const body = safeParseJson(event.body);

    const programme = String(body.programme || "").trim();
    const experienceType = String(body.experienceType || "").trim();
    const role = String(body.role || "").trim();
    const organization = String(body.organization || "").trim();
    const notes = String(body.notes || "").trim();
    const tools = String(body.tools || "").trim();
    const results = String(body.results || "").trim();

    if (!programme || !experienceType || !role || !organization || !notes) {
      return jsonResponse(400, {
        success: false,
        experience_bullets: [],
        message: "Programme, experience type, role, organization, and notes are required."
      });
    }

    const prompt = buildPrompt({
      programme,
      experienceType,
      role,
      organization,
      notes,
      tools,
      results
    });

    const response = await client.responses.create({
      model: "gpt-5.2-mini",
      input: prompt,
      text: {
        format: {
          type: "json_schema",
          name: "experience_bullets_response",
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              experience_bullets: {
                type: "array",
                minItems: 3,
                maxItems: 3,
                items: {
                  type: "string"
                }
              }
            },
            required: ["experience_bullets"]
          }
        }
      }
    });

    const parsed = safeParseJson(response.output_text);
    const bullets = normalizeBullets(parsed.experience_bullets);

    if (bullets.length !== 3) {
      return jsonResponse(500, {
        success: false,
        experience_bullets: [],
        message: "AI response was incomplete. Please try again."
      });
    }

    return jsonResponse(200, {
      success: true,
      experience_bullets: bullets,
      message: "Experience bullets generated successfully."
    });
  } catch (error) {
    console.error("generate-experience error:", error);

    return jsonResponse(500, {
      success: false,
      experience_bullets: [],
      message: error?.message || "Server error."
    });
  }
};

function buildPrompt({ programme, experienceType, role, organization, notes, tools, results }) {
  return `
You are helping a university student turn rough experience notes into truthful, professional CV bullet points.

Task:
Write exactly 3 polished CV bullet points.

Student details:
Programme: ${programme}
Experience Type: ${experienceType}
Role: ${role}
Organization: ${organization}
Rough Notes: ${notes}
Tools Used: ${tools || "Not provided"}
Results or Outcomes: ${results || "Not provided"}

Strict rules:
- Use only the information provided.
- Correct grammar, spelling, punctuation, capitalization, and sentence structure.
- Treat rough or broken student language as real effort and convert it into clean professional English.
- Do not invent achievements, numbers, software, leadership claims, or duties not supported by the input.
- Make the bullets specific to the actual role and notes.
- Avoid generic repeated phrases across all bullets.
- Start each bullet with a different strong action verb.
- Keep each bullet concise, believable, and employer-friendly.
- Do not use vague filler like "strengthened practical professional skills" unless clearly supported.
- Output valid JSON only.

Return JSON in this exact format:
{
  "experience_bullets": [
    "Bullet 1",
    "Bullet 2",
    "Bullet 3"
  ]
}
`.trim();
}

function normalizeBullets(value) {
  if (!Array.isArray(value)) return [];

  return value
    .filter(item => typeof item === "string")
    .map(item => item.trim())
    .filter(Boolean)
    .slice(0, 3);
}

function safeParseJson(value) {
  try {
    return JSON.parse(value || "{}");
  } catch {
    return {};
  }
}

function jsonResponse(statusCode, payload) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  };
}
