function requireLogin(req, res, next) {
  if (!req.session.user) {
    if (req.accepts("html")) {
      return res.redirect("/login");
    }
    return res.status(401).json({ error: "Authentication required" });
  }
  next();
}

module.exports = { requireLogin };
