"use strict";

const path = require("path");
const express = require("express");
const createStore = require("./store");
const rateLimit = require("./rateLimit");
const { validateGuide, validateMessage, TOPICS } = require("./validators");

function createApp({ rateMax = 100 } = {}) {
  const app = express();
  const store = createStore();

  app.disable("x-powered-by");
  app.use(express.json({ limit: "10kb" }));

  // Basic security headers
  app.use((req, res, next) => {
    res.set("X-Content-Type-Options", "nosniff");
    res.set("X-Frame-Options", "DENY");
    next();
  });

  // Log method, path, status, and duration
  app.use((req, res, next) => {
    const start = Date.now();
    res.on("finish", () => {
      if (process.env.NODE_ENV !== "test") {
        console.log(`${req.method} ${req.originalUrl} -> ${res.statusCode} (${Date.now() - start}ms)`);
      }
    });
    next();
  });

  const api = express.Router();
  api.use(rateLimit({ windowMs: 60_000, max: rateMax }));

  const fail = (res, status, code, message, details) =>
    res.status(status).json({ error: { code, message, ...(details ? { details } : {}) } });

  // Parse :id once; reject non-integers with 400 (syntactic validation)
  api.param("id", (req, res, next, raw) => {
    if (!/^\d+$/.test(raw)) return fail(res, 400, "BAD_REQUEST", "id must be a positive integer.");
    req.id = Number(raw);
    next();
  });

  /* ---------- Health ---------- */
  api.get("/health", (req, res) => {
    res.json({ status: "ok", uptimeSeconds: Math.round(process.uptime()) });
  });

  /* ---------- Guides (resource: noun, method: verb) ---------- */
  api.get("/guides", (req, res) => {
    const { topic } = req.query;
    if (topic !== undefined && !TOPICS.includes(topic)) {
      return fail(res, 400, "BAD_REQUEST", `topic must be one of: ${TOPICS.join(", ")}.`);
    }
    const data = store.listGuides(topic);
    res.json({ count: data.length, data });
  });

  api.get("/guides/:id", (req, res) => {
    const g = store.getGuide(req.id);
    if (!g) return fail(res, 404, "NOT_FOUND", `Guide ${req.id} not found.`);
    res.json({ data: g });
  });

  api.post("/guides", (req, res) => {
    const { errors, value } = validateGuide(req.body);
    if (errors.length) return fail(res, 400, "VALIDATION_ERROR", "Invalid guide data.", errors);
    const g = store.addGuide(value);
    res.status(201).location(`/api/guides/${g.id}`).json({ data: g });
  });

  api.put("/guides/:id", (req, res) => {
    if (!store.getGuide(req.id)) return fail(res, 404, "NOT_FOUND", `Guide ${req.id} not found.`);
    const { errors, value } = validateGuide(req.body, { partial: true });
    if (errors.length) return fail(res, 400, "VALIDATION_ERROR", "Invalid guide data.", errors);
    res.json({ data: store.updateGuide(req.id, value) });
  });

  api.delete("/guides/:id", (req, res) => {
    if (!store.deleteGuide(req.id)) return fail(res, 404, "NOT_FOUND", `Guide ${req.id} not found.`);
    res.status(204).end();
  });

  /* ---------- Messages (contact form) ---------- */
  api.post("/messages", (req, res) => {
    const { errors, value } = validateMessage(req.body);
    if (errors.length) return fail(res, 400, "VALIDATION_ERROR", "Invalid message data.", errors);
    const m = store.addMessage(value);
    res.status(201).json({ data: { id: m.id, receivedAt: m.receivedAt }, message: "Thanks! Your message was received." });
  });

  // Unknown API route -> JSON 404 (not an HTML page)
  api.use((req, res) => fail(res, 404, "NOT_FOUND", `No route for ${req.method} ${req.originalUrl}.`));

  app.use("/api", api);

  // Serve the Project 1 frontend
  app.use(express.static(path.join(__dirname, "..", "public")));

  // Central error handler: malformed JSON -> 400, everything else -> 500 (never leak internals)
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    if (err.type === "entity.parse.failed") return fail(res, 400, "BAD_REQUEST", "Malformed JSON in request body.");
    if (err.type === "entity.too.large") return fail(res, 413, "PAYLOAD_TOO_LARGE", "Request body too large.");
    console.error(err);
    fail(res, 500, "INTERNAL_ERROR", "Something went wrong on the server.");
  });

  return app;
}

module.exports = createApp;
