import { NextResponse } from "next/server";
import { InferenceClient } from "@huggingface/inference";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_KEY
);

const hfClient = new InferenceClient(process.env.HUGGINGFACE_API_KEY);

const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

const EMBEDDING_DIM = 384;

function cosineSimilarity(a, b) {
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot  += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  magA = Math.sqrt(magA);
  magB = Math.sqrt(magB);
  if (magA === 0 || magB === 0) return 0;
  return dot / (magA * magB);
}

function getRiskLevel(percent) {
  if (percent >= 80) return { level: "Very High", color: "RED"    };
  if (percent >= 60) return { level: "High",       color: "ORANGE" };
  if (percent >= 40) return { level: "Moderate",   color: "YELLOW" };
  return                    { level: "Low",        color: "GREEN"  };
}

function normalizeEmbedding(raw) {
  if (!raw) return null;
  try {
    if (typeof raw === "string") raw = JSON.parse(raw);
    if (Array.isArray(raw[0])) raw = raw[0];
    const embedding = raw.map(Number);
    if (embedding.length !== EMBEDDING_DIM) return null;
    return embedding;
  } catch { return null; }
}

function buildPrompt(title, description, score, similarList) {
  if (score < 40) {
    return `You are an academic research adviser reviewing a student's capstone research proposal.

STUDENT'S PROPOSED RESEARCH:
Title: ${title}
Description: ${description}

SIMILARITY CHECK RESULT:
Overall similarity score: ${score}% — LOW similarity. The research idea is highly original.

MOST RELATED EXISTING STUDIES (for reference only):
${similarList}

Write a short advisory note in plain paragraphs. Do NOT use letter format — no "Dear Student", no "Best Regards", no sign-off.

Your response must follow this exact structure:
1. One paragraph congratulating the student on their original idea and briefly explaining why it stands out from the existing studies listed above.
2. A short list of 2 to 3 specific suggestions to strengthen or refine the proposal — not to change the topic, just to make it more solid. Focus on things like clarifying the scope, defining the target population, or strengthening the methodology.

Be direct and specific. Do not be generic. Do not use filler phrases like "I am pleased to inform you" or "I hope this helps".`;
  }

  if (score < 60) {
    return `You are an academic research adviser helping a college student refine their capstone research idea.

STUDENT'S PROPOSED RESEARCH:
Title: ${title}
Description: ${description}

SIMILARITY CHECK RESULT:
Overall similarity score: ${score}% — MODERATE similarity. The idea has some overlap with existing studies but still has potential.

SIMILAR EXISTING STUDIES:
${similarList}

Write in plain paragraphs. Do NOT use letter format — no "Dear Student", no "Best Regards", no sign-off.

Your response must follow this exact structure:
1. One paragraph acknowledging the merit of their idea while clearly identifying the specific areas of overlap with the studies above.
2. A list of 3 to 4 specific suggestions to differentiate their research — such as a narrower scope, different target population, new variable, or unique methodology. Be specific to their topic, not generic.
3. One to 2 refined title options that better reflect a more distinct direction.

Be direct and constructive. Do not use filler phrases.`;
  }

  return `You are an academic research adviser helping a college student improve the originality of their capstone research idea.

STUDENT'S PROPOSED RESEARCH:
Title: ${title}
Description: ${description}

SIMILARITY CHECK RESULT:
Overall similarity score: ${score}% — HIGH similarity. The idea significantly overlaps with existing studies.

SIMILAR EXISTING STUDIES:
${similarList}

Write in plain paragraphs. Do NOT use letter format — no "Dear Student", no "Best Regards", no sign-off.

Your response must follow this exact structure:
1. One paragraph clearly explaining which existing studies overlap and why the current idea is too similar.
2. A list of 4 to 5 concrete suggestions to significantly differentiate the research — such as a completely different angle, new technology, different methodology, different target group, or an unexplored combination of topics. Be specific to their topic.
3. Two alternative title options that reflect a genuinely more original direction.

Be direct and solution-focused. Do not be discouraging — frame everything as an opportunity to improve. Do not use filler phrases.`;
}

export async function POST(req) {
  try {
    const { title, description } = await req.json();

    if (!title?.trim() || !description?.trim()) {
      return NextResponse.json({ error: "Title and description are required." }, { status: 400 });
    }

    // 1. Generate embedding
    const result = await hfClient.featureExtraction({
      model: "sentence-transformers/all-MiniLM-L6-v2",
      inputs: `${title}. ${description}`,
    });
    let inputEmbedding = result;
    if (ArrayBuffer.isView(inputEmbedding)) inputEmbedding = Array.from(inputEmbedding);
    if (Array.isArray(inputEmbedding[0])) inputEmbedding = inputEmbedding[0];
    inputEmbedding = inputEmbedding.map(Number);

    // 2. Fetch abstracts
    const { data: abstracts, error } = await supabase
      .from("abstracts")
      .select("id, title, department, year, abstract_text, embedding")
      .not("embedding", "is", null);

    if (error) throw new Error(error.message);

    // 3. Score and rank
    const scored = abstracts
      .map((a) => {
        const stored = normalizeEmbedding(a.embedding);
        if (!stored) return null;
        const sim     = cosineSimilarity(inputEmbedding, stored);
        const percent = parseFloat((sim * 100).toFixed(2));
        const risk    = getRiskLevel(percent);
        return {
          id:                 a.id,
          title:              a.title,
          department:         a.department ?? "—",
          year:               a.year ?? "—",
          abstract_preview:   a.abstract_text?.slice(0, 200) ?? "",
          similarity_percent: percent,
          risk_level:         risk.level,
          color:              risk.color,
        };
      })
      .filter(Boolean)
      .sort((a, b) => b.similarity_percent - a.similarity_percent)
      .slice(0, 5);

    const score = scored.length > 0 ? scored[0].similarity_percent : 0;
    const risk  = getRiskLevel(score);

    // 4. Build prompt and generate AI response
    const similarList = scored
      .map((m, i) => `${i + 1}. "${m.title}" (${m.similarity_percent}% similar, ${m.department}, ${m.year})`)
      .join("\n");

    const prompt = buildPrompt(title, description, score, similarList);

    const aiResponse = await groq.chat.completions.create({
      model:       "llama-3.3-70b-versatile",
      messages:    [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens:  800,
    });

    const recommendations = aiResponse.choices?.[0]?.message?.content?.trim()
      ?? "No recommendations could be generated.";

    // 5. Save report
    await supabase.from("similarity_reports").insert({
      student_id:         null,
      input_title:        title,
      input_description:  description,
      similarity_score:   score,
      risk_level:         risk.color.toLowerCase(),
      results_json:       scored,
      ai_recommendations: recommendations,
    });

    return NextResponse.json({ score, risk, topMatches: scored, recommendations });

  } catch (err) {
    console.error("API error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}