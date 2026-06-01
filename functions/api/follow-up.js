const ROLES = new Set([
  "engineer",
  "engineering-leader",
  "hiring",
  "founder",
  "researcher",
  "other",
]);

const CONTACT_METHODS = new Set(["linkedin", "email", "sms", "github", "other"]);

const TOPICS = new Set([
  "",
  "ai-platforms",
  "mlops",
  "cloud-security",
  "snowflake",
  "builder-tools",
  "other",
]);

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

function text(value, maxLength) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLength);
}

export async function onRequestPost({ env, request }) {
  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > 2048) {
    return json({ error: "Payload too large." }, 413);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Expected a JSON payload." }, 400);
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return json({ error: "Expected a JSON object." }, 400);
  }

  if (JSON.stringify(body).length > 2048) {
    return json({ error: "Payload too large." }, 413);
  }

  if (text(body.website, 200)) {
    return json({ ok: true }, 201);
  }

  const name = text(body.name, 100);
  const role = text(body.role, 40);
  const contactMethod = text(body.contactMethod, 24);
  const contact = text(body.contact, 180);
  const topic = text(body.topic, 32);

  if (!name || !ROLES.has(role)) {
    return json({ error: "Provide your name and role." }, 400);
  }

  if (!CONTACT_METHODS.has(contactMethod) || !contact) {
    return json({ error: "Provide one contact detail." }, 400);
  }

  if (!TOPICS.has(topic)) {
    return json({ error: "Choose a valid topic." }, 400);
  }

  if (body.consent !== true) {
    return json({ error: "Consent is required." }, 400);
  }

  await env.DB.prepare(
    `INSERT INTO follow_up_contacts
      (name, role, contact_method, contact_value, topic, consented_at)
     VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
  )
    .bind(name, role, contactMethod, contact, topic || null)
    .run();

  return json({ ok: true }, 201);
}

export function onRequestGet() {
  return json({ error: "Method not allowed." }, 405);
}
