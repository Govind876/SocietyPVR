import type { Express, RequestHandler } from "express";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";
// Simple authentication without bcrypt for now

export function getSimpleSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  
  return session({
    secret: process.env.SESSION_SECRET || 'simple-auth-secret-key',
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false, // Set to false for development
      maxAge: sessionTtl,
    },
  });
}

export function setupSimpleAuth(app: Express) {
  app.use(getSimpleSession());

  // Login route
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Check if password matches the stored password
      // In a real app, you'd use bcrypt.compare(password, user.hashedPassword)
      if (password !== user.password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Set user in session
      (req.session as any).user = user;
      res.json({ user, message: "Login successful" });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Signup route
  app.post("/api/auth/signup", async (req, res) => {
    try {
      const { email, password, firstName, lastName, role, societyId } = req.body;
      
      if (!email || !password || !firstName || !role) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      // Create new user
      const newUser = await storage.createUser({
        email,
        password,
        firstName,
        lastName,
        role,
        societyId: role !== 'super_admin' ? societyId : null,
      });

      // Set user in session
      (req.session as any).user = newUser;
      res.json({ user: newUser, message: "Signup successful" });
    } catch (error) {
      console.error("Signup error:", error);
      res.status(500).json({ message: "Signup failed" });
    }
  });

  // Get current user route
  app.get("/api/auth/user", (req, res) => {
    const user = (req.session as any)?.user;
    if (user) {
      res.json(user);
    } else {
      res.status(401).json({ message: "Unauthorized" });
    }
  });

  // Logout route
  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ message: "Logout successful" });
    });
  });
}

export const isSimpleAuthenticated: RequestHandler = (req, res, next) => {
  const user = (req.session as any)?.user;
  if (user) {
    req.user = user;
    return next();
  }
  return res.status(401).json({ message: "Unauthorized" });
};