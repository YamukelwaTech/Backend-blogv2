const errorHandler = (err, req, res, next) => {
  console.error(`[${new Date().toISOString()}] Error:`, err.stack || err);
  res.status(500).json({ message: "Internal Server Error" });
};

module.exports = errorHandler;
