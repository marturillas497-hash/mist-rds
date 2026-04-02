// app/api/analyze/route.js

export async function POST(req) {
  const { user, error: authError } = await requireAuth(req);
  if (authError) return authError;

  try {
    console.log("1. Auth passed for user:", user.id);

    const { allowed, remaining } = await checkRateLimit(user.id);
    console.log("2. Rate limit check passed:", { allowed, remaining });

    const { title, description } = await req.json();
    console.log("3. Received request:", { title: title?.slice(0, 50), description: description?.slice(0, 50) });

    if (!title?.trim() || !description?.trim()) {
      return NextResponse.json({ error: "Title and description are required." }, { status: 400 });
    }

    // 1. Generate embedding
    console.log("4. Generating embedding...");
    const inputEmbedding = await generateEmbedding(`${title}. ${description}`, "query");
    console.log("5. Embedding generated, length:", inputEmbedding.length);

    // 2. Run pgvector similarity search via RPC
    console.log("6. Calling match_abstracts RPC...");
    const { data: abstracts, error } = await supabase.rpc("match_abstracts", {
      query_embedding: inputEmbedding,
      match_count:     5,
      filter_dept:     null,
      filter_year:     null,
    });

    if (error) {
      console.error("7. RPC Error:", error);
      throw new Error(error.message);
    }
    console.log("8. RPC success, found:", abstracts?.length);

    // 3. Format results
    const scored = abstracts.map((a) => {
      const percent = parseFloat((a.similarity * 100).toFixed(2));
      const risk    = getRiskLevel(percent);
      return {
        id:                 a.id,
        title:              a.title,
        department:         a.department ?? "—",
        year:               a.year       ?? "—",
        abstract_preview:   a.abstract_text?.slice(0, 200) ?? "",
        similarity_percent: percent,
        risk_level:         risk.level,
        color:              risk.color,
      };
    });

    const score = scored.length > 0 ? scored[0].similarity_percent : 0;
    const risk  = getRiskLevel(score);

    // 4. Build prompt and generate AI recommendations
    const similarList = scored
      .map((m, i) => `${i + 1}. "${m.title}" (${m.similarity_percent}% similar, ${m.department}, ${m.year})`)
      .join("\n");

    const prompt = buildPrompt(title, description, score, similarList);
    console.log("9. Prompt built, calling Groq...");

    const aiResponse = await groq.chat.completions.create({
      model:       "llama-3.3-70b-versatile",
      messages:    [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens:  800,
    });

    console.log("10. Groq response received");
    const recommendations = aiResponse.choices?.[0]?.message?.content?.trim()
      ?? "No recommendations could be generated.";

    // 5. Save report
    console.log("11. Saving report to database...");
    const { data: savedReport, error: insertError } = await supabase.from("similarity_reports").insert({
      student_id:         user.id,
      input_title:        title,
      input_description:  description,
      similarity_score:   score,
      risk_level:         risk.color,
      results_json:       scored,
      ai_recommendations: recommendations,
    })
    .select("id")
    .single();

    if (insertError) {
      console.error("12. Insert error:", insertError);
      throw new Error(insertError.message);
    }

    console.log("13. Success! Report ID:", savedReport.id);

    return NextResponse.json(
      { score, risk, topMatches: scored, recommendations, reportId: savedReport.id, remainingSubmissions: remaining - 1 },
      { headers: { "X-RateLimit-Limit": String(DAILY_LIMIT), "X-RateLimit-Remaining": String(remaining - 1) } }
    );

  } catch (err) {
    console.error("API error at step:", err);
    return NextResponse.json({ error: err.message, step: err.step }, { status: 500 });
  }
}