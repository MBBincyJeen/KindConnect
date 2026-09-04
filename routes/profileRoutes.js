const router = require("express").Router();
const { requireLogin } = require("../middleware/requireLogin");
const profile = require("../controllers/profileController");
const { certUpload } = require("../config/multer");

router.get("/profile", requireLogin, profile.getOwnProfile);
router.get("/profile/:id", requireLogin, profile.getUserProfile);
router.post("/profile/update", requireLogin, profile.updateProfile);
router.post("/profile/upload-certificate", requireLogin, certUpload.single("certificate"), profile.uploadCertificate);
router.post("/profile/delete-certificate/:filename", requireLogin, profile.deleteCertificate);

module.exports = router;
