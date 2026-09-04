function validate(schema, source = "body") {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const errors = result.error.errors.map((e) => e.message);
      if (req.accepts("html")) {
        return res.status(400).render("error", { message: errors.join(", ") });
      }
      return res.status(400).json({ errors });
    }
    req[source] = result.data;
    next();
  };
}

module.exports = { validate };
