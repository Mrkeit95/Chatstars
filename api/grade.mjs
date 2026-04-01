// Netlify function - AI grading for academy exercises
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;

function cors(){return{'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type','Content-Type':'application/json'}}

export default async (req) => {
  if(req.method==='OPTIONS')return new Response('',{status:200,headers:cors()});
  if(req.method!=="POST")return new Response(JSON.stringify({error:"Method not allowed"}),{status:405,headers:cors()});

  try {
    const body = await req.json();
    const { exercises, moduleContext, candidateName } = body;
    if (!exercises || !Array.isArray(exercises)) return new Response(JSON.stringify({ error: "Invalid request" }), { status: 400, headers: cors() });

    const exerciseList = exercises.map((ex, i) => `Exercise ${i + 1}: "${ex.prompt}"\nResponse: "${ex.response}"`).join("\n\n");

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      signal: controller.signal,
      headers: { "Content-Type": "application/json", "x-api-key": ANTHROPIC_KEY, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 3000,
        system: `You are an expert evaluator for a chat management training academy. Grade exercise responses.

GRADING: English fluency 35%, Critical thinking 25%, Communication 20%, Professionalism 20%.
AI DETECTION: Check for overly formal structure, generic answers, no personality. Levels: none, low, medium, high, certain. If high/certain: auto-fail (score 0-10).
SCORING: 90-100 exceptional, 80-89 strong, 70-79 adequate (pass), 60-69 borderline, below 60 fail.

Respond ONLY with valid JSON, no markdown:
{"grades":[{"score":0-100,"feedback":"specific feedback","ai_detected":"none|low|medium|high|certain"}],"overall":0-100,"pass":true/false,"ai_risk":"none|low|medium|high|certain","candidate_notes":["note1","note2"]}`,
        messages: [{
          role: "user",
          content: `Candidate: ${candidateName || "Unknown"}\nModule: ${moduleContext || "General"}\n\nGrade:\n\n${exerciseList}`
        }]
      })
    });

    clearTimeout(timeout);

    if (!response.ok) {
      return new Response(JSON.stringify({ error: "API error", status: response.status }), { status: 502, headers: cors() });
    }

    const data = await response.json();
    const text = data.content?.map(i => i.text || "").join("") || "";
    const clean = text.replace(/```json|```/g, "").trim();
    const result = JSON.parse(clean);
    return new Response(JSON.stringify(result), { headers: cors() });

  } catch (err) {
    return new Response(JSON.stringify({ error: "Grading failed", details: err.message }), { status: 500, headers: cors() });
  }
};


export const config = { runtime: "edge" };
