import type { Express, RequestHandler } from "express";
import session from "express-session";
import bcrypt from "bcrypt";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";

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

      // Dual-mode authentication: support both hashed (new) and plaintext (legacy) passwords
      let passwordMatches = false;
      let needsRehash = false;

      if (user.password.startsWith('$2')) {
        // Password is hashed, use bcrypt compare
        passwordMatches = await bcrypt.compare(password, user.password);
      } else {
        // Legacy plaintext password
        passwordMatches = password === user.password;
        needsRehash = passwordMatches; // If it matches, we should rehash it
      }

      if (!passwordMatches) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // If user logged in with plaintext password, rehash it immediately
      if (needsRehash) {
        const hashedPassword = await bcrypt.hash(password, 12);
        await storage.updateUser(user.id, { password: hashedPassword });
        user.password = hashedPassword;
      }

      // Set user in session (remove password before storing in session)
      const { password: _, ...userWithoutPassword } = user;
      (req.session as any).user = userWithoutPassword;
      res.json({ user: userWithoutPassword, message: "Login successful" });
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

      // Hash password before storing
      const hashedPassword = await bcrypt.hash(password, 12);

      // Create new user
      const newUser = await storage.createUser({
        email,
        password: hashedPassword,
        firstName,
        lastName,
        role,
        societyId: role !== 'super_admin' ? societyId : null,
      });

      // Set user in session (remove password before storing in session)
      const { password: _, ...userWithoutPassword } = newUser;
      (req.session as any).user = userWithoutPassword;
      res.json({ user: userWithoutPassword, message: "Signup successful" });
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