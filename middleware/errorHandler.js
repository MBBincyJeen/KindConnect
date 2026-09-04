function errorHandler(err, req, res, _next) {
  console.error(err.stack || err.message || err);

  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({ error: "File too large" });
  }

  if (err.message && err.message.includes("File type") && err.message.includes("not allowed")) {
    return res.status(400).json({ error: err.message });
  }

  const status = err.status || 500;

  if (req.accepts("html")) {
    return res.status(status).render("error", {
      message: err.message || "Internal Server Error",
    });
  }

  res.status(status).json({
    error: err.message || "Internal Server Error",
  });
}

module.exports = { errorHandler };
