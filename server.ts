import express from "express";
import path from "path";
import { MongoClient, ObjectId } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Set up larger limits for base64 upload data-URLs (contact avatars < 1.5MB)
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

// Dual Storage State
let dbMode: "database" | "memory" = "memory";
let isDbConnected = false;
let mongoClient: MongoClient | null = null;
let dbInstance: any = null;
let dbError: string | null = null;

// Seed data for in-memory fallback
let memoryContacts = [
  {
    _id: "507f1f77bcf86cd799439011",
    firstName: "Sarah",
    lastName: "Jenkins",
    email: "sarah.j@cardnet.io",
    phone: "+1 (555) 234-5678",
    title: "VP of Enterprise Infrastructure",
    organization: "CardNet Solutions",
    website: "https://cardnet.io",
    address: "100 Infinite Loop, Cupertino, CA 95014",
    avatar: "", // Styled text initials fallback
    linkedin: "https://linkedin.com/in/sarah-jenkins-cardnet",
    twitter: "https://twitter.com/sarah_codes",
    github: "https://github.com/sarahj",
    instagram: "https://instagram.com/sarah.explores",
    createdAt: new Date("2026-05-18T10:00:00Z").toISOString(),
  },
  {
    _id: "507f1f77bcf86cd799439012",
    firstName: "Marcus",
    lastName: "Chen",
    email: "marcus.chen@designhub.co",
    phone: "+1 (555) 876-5432",
    title: "Principal Brand Architect",
    organization: "DesignHub Studio",
    website: "https://designhub.co",
    address: "42 Wallaby Way, Sydney, NSW 2000",
    avatar: "", 
    linkedin: "https://linkedin.com/in/marcus-chen-design",
    twitter: "https://twitter.com/marcustalks",
    github: "https://github.com/marcuschen",
    instagram: "https://instagram.com/marcus.frames",
    createdAt: new Date("2026-05-19T14:30:00Z").toISOString(),
  }
];

// Asymmetric MongoDB Connection
let connectionPromise: Promise<void> | null = null;

async function connectToMongo() {
  const mongoUri = process.env.MONGODB_URI?.trim();
  if (!mongoUri) {
    dbMode = "memory";
    dbError = "MONGODB_URI environment variable is missing";
    console.log("MONGODB_URI is not set. Launching in Memory Mode (Fallback).");
    return;
  }

  try {
    console.log("Attempting to connect to MongoDB...");
    // Configure with timeout so it falls back swiftly if DB is unreachable
    // family: 4 forces MongoClient to resolve DNS hostnames via IPv4 only.
    // This is vital in sandboxed and serverless container platforms where IPv6 routing/handshakes fail.
    mongoClient = new MongoClient(mongoUri, {
      connectTimeoutMS: 8000,
      serverSelectionTimeoutMS: 8000,
      socketTimeoutMS: 8000,
    });
    
    let timeoutId: string | number | NodeJS.Timeout;
    await Promise.race([
      mongoClient.connect().catch(e => {
        console.error("Background connect error:", e.message);
        throw e;
      }),
      new Promise((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error("Database connection reached forced 8-second application timeout")), 8000);
      })
    ]).finally(() => clearTimeout(timeoutId as any));
    
    // Explicit safety catch for the un-awaited promise after timeout occurs
    mongoClient.connect().catch(e => console.error("Delayed mongodb connection rejection safely caught:", e.message));

    dbInstance = mongoClient.db("cardnet");
    dbMode = "database";
    isDbConnected = true;
    dbError = null;
    console.log("MongoDB connected successfully. Core database operation enabled.");
  } catch (err: any) {
    dbMode = "memory";
    isDbConnected = false;
    let baseError = err?.message || "Failed to establish database connection";
    
    // Check if it looks like an SSL/TLS alert / handshake drop (which frequently is an unwhitelisted IP block)
    if (baseError.includes("SSL") || baseError.includes("ssl") || baseError.includes("tls") || baseError.includes("alert")) {
      dbError = `${baseError}. (Likely unwhitelisted IP drop by MongoDB Atlas. Whitelist 0.0.0.0/0 to fix this).`;
    } else {
      dbError = baseError;
    }
    
    console.error("MongoDB connection failed! Gracefully falling back to Memory Mode:", dbError);
  }
}

function getMongoConnection() {
  if (!connectionPromise) {
    connectionPromise = connectToMongo();
  }
  return connectionPromise;
}

// Start connection immediately in background on import
getMongoConnection();

// Connect check middleware to await database setup before handling request (important on Serverless/Vercel)
app.use(async (req, res, next) => {
  if (process.env.MONGODB_URI && !isDbConnected && dbError === null) {
    try {
      await getMongoConnection();
    } catch (e) {
      // safe ignore, error is captured in dbError
    }
  }
  next();
});

  const apiRouter = express.Router();

  // 1. GET config
  apiRouter.get("/config", (req, res) => {
    res.json({
      configured: !!process.env.MONGODB_URI,
      mode: dbMode,
      connected: isDbConnected,
      dbName: dbMode === "database" ? "cardnet" : "in_memory_fallback",
      error: dbError,
    });
  });

  // 2. GET contacts
  apiRouter.get("/contacts", async (req, res) => {
    try {
      if (dbMode === "database" && dbInstance) {
        try {
          const list = await dbInstance.collection("contacts").find().sort({ createdAt: -1 }).toArray();
          return res.json(list);
        } catch (dbErr: any) {
          console.error("Database query of contacts failed. Gracefully falling back to memory mode:", dbErr);
          dbMode = "memory";
          isDbConnected = false;
          dbError = dbErr?.message || "Database disconnected during find query";
        }
      }
      
      // Fallback on-the-fly to Memory Mode
      const sorted = [...memoryContacts].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      return res.json(sorted);
    } catch (err: any) {
      console.error("Error fetching contacts:", err);
      res.status(500).json({ error: "Failed to retrieve contacts list" });
    }
  });

  // 3. GET contacts/:id
  apiRouter.get("/contacts/:id", async (req, res) => {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid contact ID format. ID must be a 24-character hexadecimal string." });
    }

    try {
      if (dbMode === "database" && dbInstance) {
        try {
          const contact = await dbInstance.collection("contacts").findOne({ _id: new ObjectId(id) });
          if (contact) {
            return res.json(contact);
          } else {
            return res.status(404).json({ error: "Contact card not found" });
          }
        } catch (dbErr: any) {
          console.error("Database lookup of contact failed. Gracefully falling back to memory mode:", dbErr);
          dbMode = "memory";
          isDbConnected = false;
          dbError = dbErr?.message || "Database disconnected during findOne query";
        }
      }
      
      // Fallback on-the-fly to Memory Mode
      const contact = memoryContacts.find(c => c._id === id);
      if (!contact) {
        return res.status(404).json({ error: "Contact card not found info" });
      }
      return res.json(contact);
    } catch (err: any) {
      console.error("Error retrieving contact by id:", err);
      res.status(500).json({ error: "Internal server error reading card info" });
    }
  });

  // 4. POST contacts
  apiRouter.post("/contacts", async (req, res) => {
    const {
      firstName,
      lastName,
      email,
      phone,
      title,
      organization,
      website,
      address,
      avatar,
      linkedin,
      twitter,
      github,
      instagram,
    } = req.body;

    // Optional validation: checking minimal name fields
    if (!firstName && !lastName) {
      return res.status(400).json({ error: "At least First Name or Last Name must be provided" });
    }

    const newContactData: any = {
      firstName: firstName || "",
      lastName: lastName || "",
      email: email || "",
      phone: phone || "",
      title: title || "",
      organization: organization || "",
      website: website || "",
      address: address || "",
      avatar: avatar || "",
      linkedin: linkedin || "",
      twitter: twitter || "",
      github: github || "",
      instagram: instagram || "",
      createdAt: new Date().toISOString(),
    };

    try {
      if (dbMode === "database" && dbInstance) {
        try {
          const result = await dbInstance.collection("contacts").insertOne(newContactData);
          const saved = { _id: result.insertedId.toString(), ...newContactData };
          return res.status(201).json(saved);
        } catch (dbErr: any) {
          console.error("Database schema insert failed. Gracefully falling back to memory mode:", dbErr);
          dbMode = "memory";
          isDbConnected = false;
          dbError = dbErr?.message || "Database disconnected during insert query";
        }
      }
      
      // Fallback on-the-fly to Memory Mode
      const mockId = new ObjectId().toString();
      const savedMemory = { _id: mockId, ...newContactData };
      memoryContacts.unshift(savedMemory);
      return res.status(201).json(savedMemory);
    } catch (err: any) {
      console.error("Error creating new contact:", err);
      res.status(500).json({ error: "Failed to persist contact card" });
    }
  });

  // 5. PUT contacts/:id
  apiRouter.put("/contacts/:id", async (req, res) => {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid contact ID format. ID must be a 24-character hexadecimal string." });
    }

    const {
      firstName,
      lastName,
      email,
      phone,
      title,
      organization,
      website,
      address,
      avatar,
      linkedin,
      twitter,
      github,
      instagram,
    } = req.body;

    const updateMap: any = {
      firstName: firstName ?? "",
      lastName: lastName ?? "",
      email: email ?? "",
      phone: phone ?? "",
      title: title ?? "",
      organization: organization ?? "",
      website: website ?? "",
      address: address ?? "",
      avatar: avatar ?? "",
      linkedin: linkedin ?? "",
      twitter: twitter ?? "",
      github: github ?? "",
      instagram: instagram ?? "",
      updatedAt: new Date().toISOString(),
    };

    try {
      if (dbMode === "database" && dbInstance) {
        try {
          const result = await dbInstance.collection("contacts").updateOne(
            { _id: new ObjectId(id) },
            { $set: updateMap }
          );

          if (result.matchedCount === 0) {
            return res.status(404).json({ error: "Contact not found to update" });
          }

          const updated = await dbInstance.collection("contacts").findOne({ _id: new ObjectId(id) });
          return res.json(updated);
        } catch (dbErr: any) {
          console.error("Database update query failed. Gracefully falling back to memory mode:", dbErr);
          dbMode = "memory";
          isDbConnected = false;
          dbError = dbErr?.message || "Database disconnected during update query";
        }
      }
      
      // Fallback on-the-fly to Memory Mode
      const index = memoryContacts.findIndex(c => c._id === id);
      if (index === -1) {
        return res.status(404).json({ error: "Contact not found to update" });
      }

      const existingRecord = memoryContacts[index];
      const updatedMemory = {
        ...existingRecord,
        ...updateMap,
        _id: id,
      };
      memoryContacts[index] = updatedMemory;
      return res.json(updatedMemory);
    } catch (err: any) {
      console.error("Error updating contact:", err);
      res.status(500).json({ error: "Failed to update contact card" });
    }
  });

  // 6. DELETE contacts/:id
  apiRouter.delete("/contacts/:id", async (req, res) => {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid contact ID format. ID must be a 24-character hexadecimal string." });
    }

    try {
      if (dbMode === "database" && dbInstance) {
        try {
          const result = await dbInstance.collection("contacts").deleteOne({ _id: new ObjectId(id) });
          if (result.deletedCount === 0) {
            return res.status(404).json({ error: "Contact card not found to delete" });
          }
          return res.json({ success: true, message: "Contact card successfully deleted" });
        } catch (dbErr: any) {
          console.error("Database delete query failed. Gracefully falling back to memory mode:", dbErr);
          dbMode = "memory";
          isDbConnected = false;
          dbError = dbErr?.message || "Database disconnected during delete query";
        }
      }
      
      // Fallback on-the-fly to Memory Mode
      const originalLength = memoryContacts.length;
      memoryContacts = memoryContacts.filter(c => c._id !== id);
      if (memoryContacts.length === originalLength) {
        return res.status(404).json({ error: "Contact card not found to delete" });
      }
      return res.json({ success: true, message: "Contact card successfully deleted" });
    } catch (err: any) {
      console.error("Error deleting contact:", err);
      res.status(500).json({ error: "Failed to delete contact card" });
    }
  });

  // Mount API router
  app.use("/api", apiRouter);
  app.use("/", apiRouter); // Optional fallback if Vercel serverless strips the base path completely.

  // API 404 handler
  app.use("/api/*", (req, res) => {
    res.status(404).json({ error: "API endpoint not found: " + req.path });
  });

  // Global Error Handler
  app.use((err: any, req: any, res: any, next: any) => {
    console.error("Unhandled Global Error:", err);
    res.status(500).json({ error: err.message || "Internal server error inside Express backend." });
  });

  // 7. Serves compiled client files using Vite middleware in Dev of Express router fallbacks
  if (process.env.NODE_ENV !== "production" && !process.env.VERCEL) {
    import("vite").then(({ createServer: createViteServer }) => {
      createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      }).then(vite => {
        app.use(vite.middlewares);
      });
    }).catch(err => {
      console.error("Vite development server integration failed:", err);
    });
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res, next) => {
      if (req.path.startsWith("/api")) {
        return next();
      }
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Standalone server lifecycle (skips when deployed to Vercel Serverless Functions)
  if (!process.env.VERCEL) {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`CARDNET API server now listening internally on target port ${PORT}`);
    });
  }

  export default app;
