import express from "express";

const app = express();
const port = 3001;

app.get("/", (_req, res) => {
  res.json({ status: "ok" });
});

app.listen(port, () => {
  console.log(`Ingest server running on http://localhost:${port}`);
});
