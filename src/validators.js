"use strict";

const TOPICS = ["html", "css", "js", "design"];

/** Syntactic validation: is the format correct? Semantic: is the logic valid? */
function validateGuide(body, { partial = false } = {}) {
  const errors = [];
  if (body === null || typeof body !== "object" || Array.isArray(body)) {
    return { errors: [{ field: "body", message: "Request body must be a JSON object." }] };
  }

  const out = {};

  if (!partial || "title" in body) {
    if (typeof body.title !== "string") errors.push({ field: "title", message: "title is required and must be a string." });
    else {
      const t = body.title.trim();
      if (t.length < 3 || t.length > 80) errors.push({ field: "title", message: "title must be 3-80 characters." });
      else out.title = t;
    }
  }

  if (!partial || "text" in body) {
    if (typeof body.text !== "string") errors.push({ field: "text", message: "text is required and must be a string." });
    else {
      const t = body.text.trim();
      if (t.length < 10 || t.length > 300) errors.push({ field: "text", message: "text must be 10-300 characters." });
      else out.text = t;
    }
  }

  if (!partial || "topic" in body) {
    if (typeof body.topic !== "string" || !TOPICS.includes(body.topic)) {
      errors.push({ field: "topic", message: `topic must be one of: ${TOPICS.join(", ")}.` });
    } else out.topic = body.topic;
  }

  if ("icon" in body) {
    if (typeof body.icon !== "string" || body.icon.length > 8) errors.push({ field: "icon", message: "icon must be a short string (emoji)." });
    else out.icon = body.icon;
  }

  if (partial && Object.keys(body).length === 0) {
    errors.push({ field: "body", message: "Provide at least one field to update." });
  }

  return { errors, value: out };
}

function validateMessage(body) {
  const errors = [];
  if (body === null || typeof body !== "object" || Array.isArray(body)) {
    return { errors: [{ field: "body", message: "Request body must be a JSON object." }] };
  }
  const out = {};

  if (typeof body.name !== "string" || body.name.trim().length < 2 || body.name.trim().length > 60) {
    errors.push({ field: "name", message: "name must be 2-60 characters." });
  } else out.name = body.name.trim();

  if (typeof body.email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email) || body.email.length > 120) {
    errors.push({ field: "email", message: "email must be a valid email address." });
  } else out.email = body.email.trim().toLowerCase();

  if (typeof body.message !== "string" || body.message.trim().length < 10 || body.message.trim().length > 1000) {
    errors.push({ field: "message", message: "message must be 10-1000 characters." });
  } else out.message = body.message.trim();

  return { errors, value: out };
}

module.exports = { validateGuide, validateMessage, TOPICS };
