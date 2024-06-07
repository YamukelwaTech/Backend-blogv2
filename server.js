const http = require("http");
const app = require("./app");

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

// Error Handling
process.on("uncaughtException", (err) => {
  console.error(`[${new Date().toISOString()}] Uncaught Exception:`, err);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error(
    `[${new Date().toISOString()}] Unhandled Rejection at:`,
    promise,
    "reason:",
    reason
  );
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
