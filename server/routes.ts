import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupSimpleAuth, isSimpleAuthenticated } from "./simpleAuth";
import { insertComplaintSchema, insertFacilityBookingSchema, insertAnnouncementSchema, insertSocietySchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Simple Auth setup
  setupSimpleAuth(app);

  // Society routes
  app.get("/api/societies", isSimpleAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      if (user?.role !== 'super_admin') {
        return res.status(403).json({ message: "Forbidden" });
      }
      const societies = await storage.getSocieties();
      res.json(societies);
    } catch (error) {
      console.error("Error fetching societies:", error);
      res.status(500).json({ message: "Failed to fetch societies" });
    }
  });

  app.post("/api/societies", isSimpleAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      if (user?.role !== 'super_admin') {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const validatedData = insertSocietySchema.parse(req.body);
      const society = await storage.createSociety(validatedData);
      res.json(society);
    } catch (error) {
      console.error("Error creating society:", error);
      res.status(500).json({ message: "Failed to create society" });
    }
  });

  app.get("/api/societies/:id", isSimpleAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      const society = await storage.getSociety(req.params.id);
      
      if (!society) {
        return res.status(404).json({ message: "Society not found" });
      }
      
      // Check permission
      if (user?.role === 'resident' && user.societyId !== society.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      if (user?.role === 'admin' && user.societyId !== society.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      res.json(society);
    } catch (error) {
      console.error("Error fetching society:", error);
      res.status(500).json({ message: "Failed to fetch society" });
    }
  });

  // Residents routes
  app.get("/api/societies/:societyId/residents", isSimpleAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      const societyId = req.params.societyId;
      
      // Check permission
      if (user?.role === 'resident' && user.societyId !== societyId) {
        return res.status(403).json({ message: "Forbidden" });
      }
      if (user?.role === 'admin' && user.societyId !== societyId) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const residents = await storage.getResidentsBySociety(societyId);
      res.json(residents);
    } catch (error) {
      console.error("Error fetching residents:", error);
      res.status(500).json({ message: "Failed to fetch residents" });
    }
  });

  // Complaints routes
  app.get("/api/complaints", isSimpleAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      let complaints;
      if (user.role === 'resident') {
        complaints = await storage.getComplaintsByResident(user.id);
      } else if (user.role === 'admin' && user.societyId) {
        complaints = await storage.getComplaintsBySociety(user.societyId);
      } else {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      res.json(complaints);
    } catch (error) {
      console.error("Error fetching complaints:", error);
      res.status(500).json({ message: "Failed to fetch complaints" });
    }
  });

  app.post("/api/complaints", isSimpleAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      if (!user || user.role !== 'resident' || !user.societyId) {
        return res.status(403).json({ message: "Only residents can create complaints" });
      }
      
      const validatedData = insertComplaintSchema.parse({
        ...req.body,
        residentId: user.id,
        societyId: user.societyId,
      });
      
      const complaint = await storage.createComplaint(validatedData);
      res.json(complaint);
    } catch (error) {
      console.error("Error creating complaint:", error);
      res.status(500).json({ message: "Failed to create complaint" });
    }
  });

  app.patch("/api/complaints/:id/status", isSimpleAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      if (!user || user.role === 'resident') {
        return res.status(403).json({ message: "Only admins can update complaint status" });
      }
      
      const { status, resolutionNotes } = req.body;
      const complaint = await storage.updateComplaintStatus(req.params.id, status, resolutionNotes);
      res.json(complaint);
    } catch (error) {
      console.error("Error updating complaint:", error);
      res.status(500).json({ message: "Failed to update complaint" });
    }
  });

  // Facility bookings routes
  app.get("/api/facility-bookings", isSimpleAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      let bookings;
      if (user.role === 'resident') {
        bookings = await storage.getResidentBookings(user.id);
      } else if (user.role === 'admin' && user.societyId) {
        bookings = await storage.getFacilityBookings(user.societyId);
      } else {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      res.json(bookings);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      res.status(500).json({ message: "Failed to fetch bookings" });
    }
  });

  app.post("/api/facility-bookings", isSimpleAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      if (!user || user.role !== 'resident' || !user.societyId) {
        return res.status(403).json({ message: "Only residents can create bookings" });
      }
      
      const validatedData = insertFacilityBookingSchema.parse({
        ...req.body,
        residentId: user.id,
        societyId: user.societyId,
      });
      
      const booking = await storage.createFacilityBooking(validatedData);
      res.json(booking);
    } catch (error) {
      console.error("Error creating booking:", error);
      res.status(500).json({ message: "Failed to create booking" });
    }
  });

  app.patch("/api/facility-bookings/:id/status", isSimpleAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      if (!user || user.role === 'resident') {
        return res.status(403).json({ message: "Only admins can update booking status" });
      }
      
      const { status } = req.body;
      const booking = await storage.updateBookingStatus(req.params.id, status);
      res.json(booking);
    } catch (error) {
      console.error("Error updating booking:", error);
      res.status(500).json({ message: "Failed to update booking" });
    }
  });

  // Announcements routes
  app.get("/api/announcements", isSimpleAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      if (!user || !user.societyId) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const announcements = await storage.getAnnouncementsBySociety(user.societyId);
      res.json(announcements);
    } catch (error) {
      console.error("Error fetching announcements:", error);
      res.status(500).json({ message: "Failed to fetch announcements" });
    }
  });

  app.post("/api/announcements", isSimpleAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      if (!user || user.role === 'resident' || !user.societyId) {
        return res.status(403).json({ message: "Only admins can create announcements" });
      }
      
      const validatedData = insertAnnouncementSchema.parse({
        ...req.body,
        authorId: user.id,
        societyId: user.societyId,
      });
      
      const announcement = await storage.createAnnouncement(validatedData);
      res.json(announcement);
    } catch (error) {
      console.error("Error creating announcement:", error);
      res.status(500).json({ message: "Failed to create announcement" });
    }
  });

  // Dashboard stats routes
  app.get("/api/dashboard/stats", isSimpleAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      if (user.role === 'super_admin') {
        const stats = await storage.getGlobalStats();
        res.json(stats);
      } else if ((user.role === 'admin' || user.role === 'resident') && user.societyId) {
        const stats = await storage.getSocietyStats(user.societyId);
        res.json(stats);
      } else {
        return res.status(403).json({ message: "Forbidden" });
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  // Facilities routes
  app.get("/api/facilities", isSimpleAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      if (!user || !user.societyId) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const facilities = await storage.getFacilitiesBySociety(user.societyId);
      res.json(facilities);
    } catch (error) {
      console.error("Error fetching facilities:", error);
      res.status(500).json({ message: "Failed to fetch facilities" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
