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

    if (!programme || !experienceType || !role || !organization || !notes) {
      return jsonResponse(400, {
        success: false,
        experience_bullets: [],
        message: "All fields are required."
      });
    }

    const prompt = buildPrompt({
      programme,
      experienceType,
      role,
      organization,
      notes
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

function buildPrompt({ programme, experienceType, role, organization, notes }) {
  return `
You are helping a university student write truthful, professional CV bullet points.

Task:
Write exactly 3 concise CV bullet points.

Strict rules:
- Use only the information provided.
- Do not invent software, achievements, numbers, leadership, or responsibilities.
- Keep each bullet employer-friendly and realistic for a student or fresh graduate.
- Start each bullet with a strong action verb.
- Avoid repeating the same wording.
- Keep each bullet short and clear.
- Output valid JSON only.

Student details:
Programme: ${programme}
Experience Type: ${experienceType}
Role: ${role}
Organization: ${organization}
Notes: ${notes}
`.trim();
}

function normalizeBullets(value) {
  if (!Array.isArray(value)) return [];

  return value
    .filter((item) => typeof item === "string")
    .map((item) => item.trim())
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
