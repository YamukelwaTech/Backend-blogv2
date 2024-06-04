const express = require("express");
const cors = require("cors");
const http = require("http");
const { router: postsRoutes } = require("./routes/routes");
const sslRedirect = require('express-sslify');

const PORT = process.env.PORT || 10000;

const app = express();
const server = http.createServer(app);



// Middleware setup
app.use(express.json());
app.use(cors());
app.use("/assets", express.static("assets"));
app.use("/posts", postsRoutes);

// Redirect HTTP to HTTPS
app.use(sslRedirect.HTTPS({ trustProtoHeader: true }));

// Error Handling
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
