const TOPICS = [
  { id: "ai-platforms", label: "AI platforms" },
  { id: "mlops", label: "MLOps" },
  { id: "cloud-security", label: "Cloud security" },
  { id: "snowflake", label: "Snowflake" },
  { id: "builder-tools", label: "Builder tools" },
];

const TOPIC_IDS = new Set(TOPICS.map((topic) => topic.id));

function json(payload, status = 200) {
  return Response.json(payload, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "Content-Type": "application/json; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

async function readPulse(env, request) {
  const { results } = await env.DB.prepare(
    "SELECT topic, count, updated_at FROM pulse_totals ORDER BY count DESC, topic ASC",
  ).all();
  const counts = new Map(results.map((row) => [row.topic, Number(row.count)]));
  const topics = TOPICS.map((topic) => ({
    ...topic,
    count: counts.get(topic.id) || 0,
  }));

  return {
    total: topics.reduce((sum, topic) => sum + topic.count, 0),
    topics,
    edge: request.cf?.colo || "EDGE",
    updatedAt:
      results.find((row) => row.updated_at)?.updated_at ||
      new Date().toISOString(),
  };
}

export async function onRequestGet({ env, request }) {
  return json(await readPulse(env, request));
}

export async function onRequestPost({ env, request }) {
  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > 256) {
    return json({ error: "Payload too large." }, 413);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Expected a JSON payload." }, 400);
  }

  if (!TOPIC_IDS.has(body.topic)) {
    return json({ error: "Choose a valid topic." }, 400);
  }

  await env.DB.prepare(
    `INSERT INTO pulse_totals (topic, count, updated_at)
     VALUES (?, 1, CURRENT_TIMESTAMP)
     ON CONFLICT(topic) DO UPDATE SET
       count = count + 1,
       updated_at = CURRENT_TIMESTAMP`,
  )
    .bind(body.topic)
    .run();

  return json(await readPulse(env, request), 201);
}
