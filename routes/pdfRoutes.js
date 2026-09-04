const router = require("express").Router();
const { requireLogin } = require("../middleware/requireLogin");
const pdf = require("../controllers/pdfController");
const { pdfUpload } = require("../config/multer");

router.get("/pdf/upload", requireLogin, pdf.getPdfUploadPage);
router.post("/pdf/upload", requireLogin, pdfUpload.single("pdfFile"), pdf.postPdfUpload);
router.get("/pdf/list", requireLogin, pdf.getPdfList);
router.get("/pdf/:id/question", requireLogin, pdf.getPdfQuestionPage);
router.post("/pdf/:id/question", requireLogin, pdf.postPdfQuestion);

module.exports = router;
