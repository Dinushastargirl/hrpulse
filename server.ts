import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const JWT_SECRET = process.env.JWT_SECRET || "hr-pulse-secret-key-123";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", message: "HR Pulse API is running" });
  });

  // Mock Auth for demonstration of JWT requirement
  // In a real app, we'd use Firebase Auth tokens, but the user asked for JWT/Bcrypt
  app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body;
    // This is a simplified mock. In the real app, we use Firebase Auth on the frontend.
    // We issue a backend JWT for any server-side protected routes.
    const token = jwt.sign({ email, role: 'employee' }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ token });
  });

  // Vite middleware for development
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
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
