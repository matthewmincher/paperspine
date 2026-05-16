import { Router } from "express";
import multer from "multer";
import { extractBooksFromImage } from "../services/vision.js";
import { enrichBooks, type EnrichedBook } from "../services/enrichment.js";
import { uploadToAws } from "../services/upload.js";

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
    const extracted = await extractBooksFromImage(
      req.file.buffer,
      req.file.mimetype,
    );
    const books = await enrichBooks(extracted);
    res.json({
      books,
      shelfPhoto: req.file.buffer.toString("base64"),
      shelfPhotoMimeType: req.file.mimetype,
    });
  } catch (err) {
    console.error("Extraction failed:", err);
    res.status(500).json({ error: "Failed to extract books from image" });
  }
});

extractionRouter.post("/enrich", async (req, res) => {
  const { title, author } = req.body;
  if (!title || !author) {
    res.status(400).json({ error: "Title and author are required" });
    return;
  }

  try {
    const books = await enrichBooks([{ title, author, confidence: "high" }]);
    res.json({ book: books[0] });
  } catch (err) {
    console.error("Enrichment failed:", err);
    res.status(500).json({ error: "Failed to enrich book" });
  }
});

extractionRouter.post("/upload", async (req, res) => {
  const { shelfName, shelfPhoto, shelfPhotoMimeType, books } = req.body as {
    shelfName: string;
    shelfPhoto?: string;
    shelfPhotoMimeType?: string;
    books: EnrichedBook[];
  };

  if (!shelfName || !books?.length) {
    res.status(400).json({ error: "Shelf name and at least one book required" });
    return;
  }

  try {
    const result = await uploadToAws({
      shelfName,
      shelfPhoto: shelfPhoto ? Buffer.from(shelfPhoto, "base64") : undefined,
      shelfPhotoMimeType,
      books,
    });
    res.json(result);
  } catch (err) {
    console.error("Upload failed:", err);
    res.status(500).json({ error: "Failed to upload to AWS" });
  }
});
