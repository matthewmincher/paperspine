import { Router } from "express";
import multer from "multer";
import { extractBooksFromImage } from "../services/vision.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

export const extractionRouter = Router();

extractionRouter.post("/extract", upload.single("photo"), async (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: "No image file provided" });
    return;
  }

  try {
    const books = await extractBooksFromImage(
      req.file.buffer,
      req.file.mimetype,
    );
    res.json({ books });
  } catch (err) {
    console.error("Extraction failed:", err);
    res.status(500).json({ error: "Failed to extract books from image" });
  }
});
