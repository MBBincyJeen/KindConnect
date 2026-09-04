function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.session.user) {
      if (req.accepts("html")) {
        return res.redirect("/login");
      }
      return res.status(401).json({ error: "Authentication required" });
    }
    if (!roles.includes(req.session.user.role)) {
      if (req.accepts("html")) {
        return res.status(403).send("Forbidden");
      }
      return res.status(403).json({ error: "Insufficient permissions" });
    }
    next();
  };
}

module.exports = { requireRole };
