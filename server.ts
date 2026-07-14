import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { db } from "./src/db/index.ts";
import { captures } from "./src/db/schema.ts";
import { requireAuth, AuthRequest } from "./src/lib/auth-middleware.ts";
import { getOrCreateUser } from "./src/db/users.ts";
import { eq, desc, and } from "drizzle-orm";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Set up body parsing with high limit for Base64 camera images
  app.use(express.json({ limit: '12mb' }));
  app.use(express.urlencoded({ limit: '12mb', extended: true }));

  // API Endpoints
  // GET /api/captures: Publicly get last 50 captures from PostgreSQL
  app.get("/api/captures", async (req, res) => {
    try {
      const results = await db.select({
        id: captures.id,
        photo: captures.photo,
        timestamp: captures.timestamp,
        itemType: captures.itemType,
        temperature: captures.temperature,
        isOfficial: captures.isOfficial,
      })
      .from(captures)
      .orderBy(desc(captures.id))
      .limit(50);

      res.json(results);
    } catch (err) {
      console.error("Error fetching captures from PostgreSQL:", err);
      res.status(500).json({ error: "Failed to load captures" });
    }
  });

  // POST /api/captures: Public endpoint to save a capture
  app.post("/api/captures", async (req, res) => {
    try {
      const { photo, itemType, temperature, isOfficial } = req.body;
      if (!photo) {
        return res.status(400).json({ error: "Photo data is required" });
      }

      const [newCapture] = await db.insert(captures)
        .values({
          userId: null,
          photo,
          timestamp: Date.now(),
          itemType: itemType || "unknown",
          temperature: temperature || 350,
          isOfficial: !!isOfficial
        })
        .returning();

      res.status(201).json(newCapture);
    } catch (err) {
      console.error("Error storing capture in PostgreSQL:", err);
      res.status(500).json({ error: "Failed to store capture" });
    }
  });

  // DELETE /api/captures/:id: Public delete
  app.delete("/api/captures/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const result = await db.delete(captures)
        .where(eq(captures.id, id))
        .returning();

      if (result.length === 0) {
        return res.status(404).json({ error: "Capture not found" });
      }
      res.json({ success: true });
    } catch (err) {
      console.error("Error deleting capture from PostgreSQL:", err);
      res.status(500).json({ error: "Failed to delete capture" });
    }
  });

  // POST /api/captures/clear: Public clear
  app.post("/api/captures/clear", async (req, res) => {
    try {
      await db.delete(captures);
      res.json({ success: true });
    } catch (err) {
      console.error("Error clearing captures in PostgreSQL:", err);
      res.status(500).json({ error: "Failed to clear captures" });
    }
  });

  // Vite integration middleware
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
