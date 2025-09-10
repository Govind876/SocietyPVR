import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupSimpleAuth, isSimpleAuthenticated } from "./simpleAuth";
import { insertComplaintSchema, insertFacilityBookingSchema, insertAnnouncementSchema, insertSocietySchema, insertPollSchema, insertVoteSchema, insertMarketplaceItemSchema, insertUserSchema } from "@shared/schema";

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

  // Voting routes
  app.post("/api/polls", isSimpleAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      if (!user || user.role === 'resident') {
        return res.status(403).json({ message: "Only admins can create polls" });
      }
      
      const pollData = insertPollSchema.parse({
        ...req.body,
        createdById: user.id,
        societyId: user.societyId,
      });
      
      const poll = await storage.createPoll(pollData);
      
      // Create poll options if provided
      if (req.body.options && Array.isArray(req.body.options)) {
        for (const [index, optionText] of req.body.options.entries()) {
          await storage.createPollOption({
            pollId: poll.id,
            optionText,
            orderIndex: index,
          });
        }
      }
      
      res.json(poll);
    } catch (error) {
      console.error("Error creating poll:", error);
      res.status(500).json({ message: "Failed to create poll" });
    }
  });

  app.get("/api/polls", isSimpleAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      if (!user || !user.societyId) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const polls = await storage.getPollsBySociety(user.societyId);
      
      // Add user voting status for each poll
      for (const poll of polls) {
        poll.hasVoted = await storage.hasUserVoted(poll.id, user.id);
        if (poll.hasVoted) {
          poll.userVote = await storage.getUserVote(poll.id, user.id);
        }
      }
      
      res.json(polls);
    } catch (error) {
      console.error("Error fetching polls:", error);
      res.status(500).json({ message: "Failed to fetch polls" });
    }
  });

  app.get("/api/polls/:pollId", isSimpleAuthenticated, async (req: any, res) => {
    try {
      const { pollId } = req.params;
      const user = req.user;
      
      const poll = await storage.getPoll(pollId);
      if (!poll) {
        return res.status(404).json({ message: "Poll not found" });
      }
      
      // Check if user belongs to the same society as the poll
      if (user.societyId !== poll.societyId) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      poll.hasVoted = await storage.hasUserVoted(pollId, user.id);
      if (poll.hasVoted) {
        poll.userVote = await storage.getUserVote(pollId, user.id);
      }
      
      res.json(poll);
    } catch (error) {
      console.error("Error fetching poll:", error);
      res.status(500).json({ message: "Failed to fetch poll" });
    }
  });

  app.post("/api/polls/:pollId/vote", isSimpleAuthenticated, async (req: any, res) => {
    try {
      const { pollId } = req.params;
      const { optionId } = req.body;
      const user = req.user;
      
      // Check if poll exists and is active
      const poll = await storage.getPoll(pollId);
      if (!poll) {
        return res.status(404).json({ message: "Poll not found" });
      }
      
      // Check if user belongs to the same society as the poll
      if (user.societyId !== poll.societyId) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      if (poll.status !== "active") {
        return res.status(400).json({ message: "Poll is not active" });
      }
      
      // Check if poll has ended
      if (new Date() > new Date(poll.endDate)) {
        return res.status(400).json({ message: "Poll has ended" });
      }
      
      const voteData = insertVoteSchema.parse({
        pollId,
        voterId: user.id,
        optionId,
      });
      
      const vote = await storage.castVote(voteData);
      
      res.json(vote);
    } catch (error: any) {
      console.error("Error casting vote:", error);
      if (error?.message === "User has already voted for this poll") {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Failed to cast vote" });
      }
    }
  });

  app.get("/api/polls/:pollId/results", isSimpleAuthenticated, async (req: any, res) => {
    try {
      const { pollId } = req.params;
      const user = req.user;
      
      const poll = await storage.getPoll(pollId);
      if (!poll) {
        return res.status(404).json({ message: "Poll not found" });
      }
      
      // Check if user belongs to the same society as the poll
      if (user.societyId !== poll.societyId) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const results = await storage.getPollResults(pollId);
      res.json({
        poll,
        results,
      });
    } catch (error) {
      console.error("Error fetching poll results:", error);
      res.status(500).json({ message: "Failed to fetch poll results" });
    }
  });

  app.put("/api/polls/:pollId/status", isSimpleAuthenticated, async (req: any, res) => {
    try {
      const { pollId } = req.params;
      const { status } = req.body;
      const user = req.user;
      
      // Only admins can change poll status
      if (user.role === 'resident') {
        return res.status(403).json({ message: "Insufficient permissions" });
      }
      
      const poll = await storage.getPoll(pollId);
      if (!poll) {
        return res.status(404).json({ message: "Poll not found" });
      }
      
      // Check if user belongs to the same society as the poll
      if (user.societyId !== poll.societyId) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const updatedPoll = await storage.updatePollStatus(pollId, status);
      res.json(updatedPoll);
    } catch (error: any) {
      console.error("Error updating poll status:", error);
      res.status(500).json({ message: "Failed to update poll status" });
    }
  });

  // User/Resident routes
  app.post("/api/residents", isSimpleAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      
      // Only admins and super admins can create residents
      if (user.role === 'resident') {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const validatedData = insertUserSchema.parse({
        ...req.body,
        role: 'resident',
        societyId: user.role === 'admin' ? user.societyId : req.body.societyId,
      });

      const resident = await storage.createUser(validatedData);
      res.json(resident);
    } catch (error) {
      console.error("Error creating resident:", error);
      res.status(500).json({ message: "Failed to create resident" });
    }
  });

  app.get("/api/residents", isSimpleAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      
      // Only admins and super admins can view all residents
      if (user.role === 'resident') {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      // For now, we'll need to implement a getResidentsBySociety method
      // This is a basic implementation that returns empty array
      res.json([]);
    } catch (error) {
      console.error("Error fetching residents:", error);
      res.status(500).json({ message: "Failed to fetch residents" });
    }
  });

  // Marketplace routes
  app.get("/api/marketplace", isSimpleAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      if (!user?.societyId) {
        return res.status(400).json({ message: "User must belong to a society" });
      }
      
      const items = await storage.getMarketplaceItemsBySociety(user.societyId);
      res.json(items);
    } catch (error) {
      console.error("Error fetching marketplace items:", error);
      res.status(500).json({ message: "Failed to fetch marketplace items" });
    }
  });

  app.post("/api/marketplace", isSimpleAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      if (!user?.societyId) {
        return res.status(400).json({ message: "User must belong to a society" });
      }

      const validatedData = insertMarketplaceItemSchema.parse({
        ...req.body,
        sellerId: user.id,
        sellerName: `${user.firstName || ""} ${user.lastName || ""}`.trim() || "Unknown",
        societyId: user.societyId,
      });

      const item = await storage.createMarketplaceItem(validatedData);
      res.json(item);
    } catch (error) {
      console.error("Error creating marketplace item:", error);
      res.status(500).json({ message: "Failed to create marketplace item" });
    }
  });

  app.get("/api/marketplace/my-items", isSimpleAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      const items = await storage.getMarketplaceItemsBySeller(user.id);
      res.json(items);
    } catch (error) {
      console.error("Error fetching user marketplace items:", error);
      res.status(500).json({ message: "Failed to fetch your marketplace items" });
    }
  });

  app.get("/api/marketplace/:id", isSimpleAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      const item = await storage.getMarketplaceItem(req.params.id);
      
      if (!item) {
        return res.status(404).json({ message: "Item not found" });
      }

      // Check if user can access this item (same society)
      if (item.societyId !== user.societyId) {
        return res.status(403).json({ message: "Access denied" });
      }

      res.json(item);
    } catch (error) {
      console.error("Error fetching marketplace item:", error);
      res.status(500).json({ message: "Failed to fetch marketplace item" });
    }
  });

  app.patch("/api/marketplace/:id", isSimpleAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      const item = await storage.getMarketplaceItem(req.params.id);
      
      if (!item) {
        return res.status(404).json({ message: "Item not found" });
      }

      // Only item owner can update
      if (item.sellerId !== user.id) {
        return res.status(403).json({ message: "Only item owner can update" });
      }

      const validatedData = insertMarketplaceItemSchema.partial().parse(req.body);
      const updatedItem = await storage.updateMarketplaceItem(req.params.id, validatedData);
      res.json(updatedItem);
    } catch (error) {
      console.error("Error updating marketplace item:", error);
      res.status(500).json({ message: "Failed to update marketplace item" });
    }
  });

  app.patch("/api/marketplace/:id/status", isSimpleAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      const { status } = req.body;
      const item = await storage.getMarketplaceItem(req.params.id);
      
      if (!item) {
        return res.status(404).json({ message: "Item not found" });
      }

      // Only item owner can change status
      if (item.sellerId !== user.id) {
        return res.status(403).json({ message: "Only item owner can change status" });
      }

      const updatedItem = await storage.updateMarketplaceItemStatus(req.params.id, status);
      res.json(updatedItem);
    } catch (error) {
      console.error("Error updating marketplace item status:", error);
      res.status(500).json({ message: "Failed to update item status" });
    }
  });

  app.delete("/api/marketplace/:id", isSimpleAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      const item = await storage.getMarketplaceItem(req.params.id);
      
      if (!item) {
        return res.status(404).json({ message: "Item not found" });
      }

      // Only item owner can delete
      if (item.sellerId !== user.id) {
        return res.status(403).json({ message: "Only item owner can delete" });
      }

      await storage.deleteMarketplaceItem(req.params.id);
      res.json({ message: "Item deleted successfully" });
    } catch (error) {
      console.error("Error deleting marketplace item:", error);
      res.status(500).json({ message: "Failed to delete marketplace item" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
