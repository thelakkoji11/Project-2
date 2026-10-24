"use strict";

const createApp = require("./app");

const PORT = process.env.PORT || 3000;
const server = createApp().listen(PORT, () => {
  console.log(`Craft Studio API running at http://localhost:${PORT}`);
  console.log(`Try: http://localhost:${PORT}/api/guides`);
});

// Graceful shutdown (resilience)
for (const sig of ["SIGINT", "SIGTERM"]) {
  process.on(sig, () => server.close(() => process.exit(0)));
}
