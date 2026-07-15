import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { db } from "./src/db/index.ts";
import { captures } from "./src/db/schema.ts";
import { requireAuth, AuthRequest } from "./src/lib/auth-middleware.ts";
import { getOrCreateUser } from "./src/db/users.ts";
import { eq, desc, and } from "drizzle-orm";
import fs from "fs";

const JSON_DB_PATH = path.join(process.cwd(), "captures_db.json");

// Helper to read from captures_db.json
function readCapturesFromJson(): any[] {
  try {
    if (fs.existsSync(JSON_DB_PATH)) {
      const data = fs.readFileSync(JSON_DB_PATH, "utf-8");
      return JSON.parse(data || "[]");
    }
  } catch (err) {
    console.error("Error reading captures from JSON file:", err);
  }
  return [];
}

// Helper to write to captures_db.json
function writeCapturesToJson(data: any[]) {
  try {
    fs.writeFileSync(JSON_DB_PATH, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing captures to JSON file:", err);
  }
}

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
      if (process.env.SQL_HOST) {
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

        return res.json(results);
      } else {
        throw new Error("No SQL_HOST configured, using JSON fallback.");
      }
    } catch (err) {
      console.warn("Falling back to captures_db.json on GET /api/captures:", err.message || err);
      const jsonResults = readCapturesFromJson();
      const sorted = [...jsonResults].sort((a, b) => b.timestamp - a.timestamp).slice(0, 50);
      res.json(sorted);
    }
  });

  // POST /api/captures: Public endpoint to save a capture
  app.post("/api/captures", async (req, res) => {
    try {
      const { photo, itemType, temperature, isOfficial } = req.body;
      if (!photo) {
        return res.status(400).json({ error: "Photo data is required" });
      }

      if (process.env.SQL_HOST) {
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

        return res.status(201).json(newCapture);
      } else {
        throw new Error("No SQL_HOST configured, using JSON fallback.");
      }
    } catch (err) {
      console.warn("Falling back to captures_db.json on POST /api/captures:", err.message || err);
      const { photo, itemType, temperature, isOfficial } = req.body;
      const jsonResults = readCapturesFromJson();
      const newCapture = {
        id: Date.now() + Math.floor(Math.random() * 1000),
        photo,
        timestamp: Date.now(),
        itemType: itemType || "unknown",
        temperature: temperature || 350,
        isOfficial: !!isOfficial
      };
      jsonResults.push(newCapture);
      writeCapturesToJson(jsonResults);
      res.status(201).json(newCapture);
    }
  });

  // DELETE /api/captures/:id: Public delete
  app.delete("/api/captures/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (process.env.SQL_HOST) {
        const result = await db.delete(captures)
          .where(eq(captures.id, id))
          .returning();

        if (result.length > 0) {
          return res.json({ success: true });
        }
      }
      throw new Error("Not deleted from SQL or SQL not configured.");
    } catch (err) {
      console.warn("Falling back to captures_db.json on DELETE /api/captures/:id:", err.message || err);
      const id = parseInt(req.params.id);
      const jsonResults = readCapturesFromJson();
      const filtered = jsonResults.filter((c) => c.id !== id);
      writeCapturesToJson(filtered);
      res.json({ success: true });
    }
  });

  // POST /api/captures/clear: Public clear
  app.post("/api/captures/clear", async (req, res) => {
    try {
      if (process.env.SQL_HOST) {
        await db.delete(captures);
        return res.json({ success: true });
      } else {
        throw new Error("No SQL_HOST configured.");
      }
    } catch (err) {
      console.warn("Falling back to captures_db.json on POST /api/captures/clear:", err.message || err);
      writeCapturesToJson([]);
      res.json({ success: true });
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
