const router = require("express").Router();
const auth = require("../controllers/authController");

router.get("/", (req, res) => {
  if (req.session.user) return res.redirect("/dashboard");
  res.redirect("/login");
});

router.get("/register", auth.getRegister);
router.post("/register", auth.postRegister);
router.get("/login", auth.getLogin);
router.post("/login", auth.postLogin);
router.get("/logout", auth.logout);

const { requireLogin } = require("../middleware/requireLogin");
router.post("/save-location", requireLogin, auth.saveLocation);

module.exports = router;
