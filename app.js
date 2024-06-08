// app.js
const express = require("express");
const cors = require("cors");
// const sslRedirect = require("express-sslify");
const { postsRoutes } = require("./routes");
const errorHandler = require("./middlewares/errorHandler");

console.log("postsRoutes:", postsRoutes);

const app = express();

// Redirect HTTP to HTTPS
// app.use(sslRedirect.HTTPS({ trustProtoHeader: true }));

// Middleware setup
app.use(express.json());
app.use(cors());
app.use("/assets", express.static("assets"));
app.use("/posts", postsRoutes);

// Centralized Error Handling Middleware
app.use(errorHandler);

module.exports = app;
