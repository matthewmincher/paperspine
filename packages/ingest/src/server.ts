import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { extractionRouter } from "./routes/extraction.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const port = process.env.PORT ?? 3001;

app.use(express.json({ limit: "50mb" }));
app.use(express.static(path.join(__dirname, "../public")));

app.use("/api", extractionRouter);

app.listen(port, () => {
  console.log(`Ingest server running on http://localhost:${port}`);
});
