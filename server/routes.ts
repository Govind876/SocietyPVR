import type { Express } from "express";
import { createServer, type Server } from "http";
import { z } from "zod";
import { storage } from "./storage";
import { setupSimpleAuth, isSimpleAuthenticated } from "./simpleAuth";
import { insertComplaintSchema, insertFacilityBookingSchema, insertAnnouncementSchema, insertSocietySchema, insertPollSchema, insertVoteSchema, insertMarketplaceItemSchema, insertUserSchema } from "@shared/schema";
import { sendAnnouncementToResidents, sendComplaintNotification, sendBookingNotification, sendVotingNotification } from "./emailService";

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
      
      // Validate the society data
      const validationResult = insertSocietySchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          error: 'Invalid society data',
          details: validationResult.error.issues
        });
      }
      
      const society = await storage.createSociety(validationResult.data);
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

  // Admin assignment routes (Super Admin only)
  app.get("/api/admins/unassigned", isSimpleAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      if (user?.role !== 'super_admin') {
        return res.status(403).json({ message: "Only super admin can access this resource" });
      }
      const unassignedAdmins = await storage.getUnassignedAdmins();
      res.json(unassignedAdmins);
    } catch (error) {
      console.error("Error fetching unassigned admins:", error);
      res.status(500).json({ message: "Failed to fetch unassigned admins" });
    }
  });

  app.post("/api/societies/:societyId/assign-admin", isSimpleAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      if (user?.role !== 'super_admin') {
        return res.status(403).json({ message: "Only super admin can assign admins" });
      }
      
      const { adminId } = req.body;
      if (!adminId) {
        return res.status(400).json({ message: "Admin ID is required" });
      }
      
      await storage.assignAdminToSociety(adminId, req.params.societyId);
      res.json({ message: "Admin assigned successfully" });
    } catch (error) {
      console.error("Error assigning admin:", error);
      const message = error instanceof Error ? error.message : "Failed to assign admin";
      
      // Check if it's a validation error (business rule violation)
      if (message.includes('already has an admin') || message.includes('Admin user not found') || message.includes('must have admin role')) {
        return res.status(409).json({ message });
      }
      
      res.status(500).json({ message });
    }
  });

  app.delete("/api/societies/:societyId/admin", isSimpleAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      if (user?.role !== 'super_admin') {
        return res.status(403).json({ message: "Only super admin can remove admins" });
      }
      
      await storage.removeAdminFromSociety(req.params.societyId);
      res.json({ message: "Admin removed successfully" });
    } catch (error) {
      console.error("Error removing admin:", error);
      res.status(500).json({ message: "Failed to remove admin" });
    }
  });

  app.get("/api/societies/:societyId/admin", isSimpleAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      if (user?.role !== 'super_admin') {
        return res.status(403).json({ message: "Only super admin can access this resource" });
      }
      
      const admin = await storage.getAdminBySociety(req.params.societyId);
      res.json(admin || null);
    } catch (error) {
      console.error("Error fetching society admin:", error);
      res.status(500).json({ message: "Failed to fetch society admin" });
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
      
      // Send email notification to admins
      try {
        const society = await storage.getSociety(user.societyId);
        if (society) {
          const admin = await storage.getAdminBySociety(user.societyId);
          const adminEmails = admin?.email ? [admin.email] : [];
          
          if (adminEmails.length > 0) {
            await sendComplaintNotification(adminEmails, {
              id: complaint.id,
              title: complaint.title,
              description: complaint.description,
              category: complaint.category || 'General',
              priority: complaint.priority || 'medium',
              residentName: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
              flatNumber: user.flatNumber || 'N/A',
              societyName: society.name
            });
          }
        }
      } catch (emailError) {
        console.error('Error sending complaint notification emails:', emailError);
        // Don't fail the complaint creation if email fails
      }
      
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
      
      // Send email notification to resident about booking status change
      try {
        const resident = await storage.getUser(booking.residentId);
        const facilities = await storage.getFacilitiesBySociety(booking.societyId);
        const facility = facilities.find(f => f.id === booking.facilityId);
        const society = await storage.getSociety(booking.societyId);
        
        if (resident && resident.email && facility && society) {
          await sendBookingNotification(resident.email, {
            id: booking.id,
            facilityName: facility.name,
            bookingDate: booking.bookingDate?.toISOString() || new Date().toISOString(),
            startTime: booking.startTime,
            endTime: booking.endTime,
            status: booking.status || 'pending',
            totalAmount: booking.totalAmount || 0,
            residentName: `${resident.firstName || ''} ${resident.lastName || ''}`.trim(),
            societyName: society.name
          });
        }
      } catch (emailError) {
        console.error('Error sending booking notification email:', emailError);
        // Don't fail the booking update if email fails
      }
      
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
      
      // Send email notifications to all residents in the society
      try {
        const residents = await storage.getResidentsBySociety(user.societyId);
        const society = await storage.getSociety(user.societyId);
        
        if (residents.length > 0 && society) {
          const emailSuccess = await sendAnnouncementToResidents(
            residents.map(resident => ({
              email: resident.email || '',
              firstName: resident.firstName || '',
              lastName: resident.lastName || undefined,
            })),
            {
              title: announcement.title,
              content: announcement.content,
              isUrgent: announcement.isUrgent || false,
              societyName: society.name,
            }
          );
          
          if (emailSuccess) {
            console.log(`Announcement emails sent to ${residents.length} residents`);
          } else {
            console.warn('Failed to send announcement emails, but announcement was created');
          }
        }
      } catch (emailError) {
        console.error('Error sending announcement emails:', emailError);
        // Don't fail the announcement creation if email fails
      }
      
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
      
      // Send email notifications to residents about new poll
      try {
        const society = await storage.getSociety(user.societyId);
        if (society) {
          const residents = await storage.getResidentsBySociety(user.societyId);
          const residentsWithEmails = residents
            .filter(resident => resident.email)
            .map(resident => ({
              email: resident.email!,
              firstName: resident.firstName || 'Resident'
            }));
          
          if (residentsWithEmails.length > 0) {
            await sendVotingNotification(residentsWithEmails, {
              id: poll.id,
              title: poll.title,
              description: poll.description,
              endDate: poll.endDate.toISOString(),
              societyName: society.name,
              createdByName: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
              isAnonymous: poll.isAnonymous || false
            });
          }
        }
      } catch (emailError) {
        console.error('Error sending voting notification emails:', emailError);
        // Don't fail the poll creation if email fails
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
    } catch (error) {
      console.error("Error casting vote:", error);
      const message = error instanceof Error ? error.message : "Failed to cast vote";
      
      if (message === "User has already voted for this poll") {
        res.status(400).json({ message });
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

      const societyId = user.role === 'admin' ? user.societyId : req.query.societyId;
      if (!societyId) {
        return res.status(400).json({ message: "Society ID is required" });
      }

      const residents = await storage.getResidentsBySociety(societyId);
      res.json(residents);
    } catch (error) {
      console.error("Error fetching residents:", error);
      res.status(500).json({ message: "Failed to fetch residents" });
    }
  });

  app.patch("/api/residents/:id", isSimpleAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      const residentId = req.params.id;
      
      // Only admins and super admins can update residents
      if (user.role === 'resident') {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      // For admins, check that the resident belongs to their society
      if (user.role === 'admin') {
        const existingResident = await storage.getUser(residentId);
        if (!existingResident) {
          return res.status(404).json({ message: "Resident not found" });
        }
        if (existingResident.societyId !== user.societyId) {
          return res.status(403).json({ message: "Cannot modify residents from other societies" });
        }
      }

      // Create a restricted schema that only allows safe fields to prevent privilege escalation
      const updateResidentSchema = insertUserSchema.pick({
        email: true,
        firstName: true,
        lastName: true,
        phoneNumber: true,
        flatNumber: true,
      }).partial();

      const validatedData = updateResidentSchema.parse(req.body);
      const updatedResident = await storage.updateUser(residentId, validatedData);
      res.json(updatedResident);
    } catch (error) {
      console.error("Error updating resident:", error);
      res.status(500).json({ message: "Failed to update resident" });
    }
  });

  app.delete("/api/residents/:id", isSimpleAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      const residentId = req.params.id;
      
      // Only admins and super admins can delete residents
      if (user.role === 'resident') {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      // For admins, check that the resident belongs to their society
      if (user.role === 'admin') {
        const existingResident = await storage.getUser(residentId);
        if (!existingResident) {
          return res.status(404).json({ message: "Resident not found" });
        }
        if (existingResident.societyId !== user.societyId) {
          return res.status(403).json({ message: "Cannot delete residents from other societies" });
        }
      }

      await storage.deleteUser(residentId);
      res.json({ message: "Resident deleted successfully" });
    } catch (error) {
      console.error("Error deleting resident:", error);
      res.status(500).json({ message: "Failed to delete resident" });
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

  // System Settings Schema
  const systemSettingsSchema = z.object({
    security: z.object({
      sessionTimeout: z.number().min(5).max(480),
      enforceStrongPasswords: z.boolean(),
      enableTwoFactor: z.boolean(),
      maxLoginAttempts: z.number().min(1).max(20),
    }),
    notifications: z.object({
      emailNotifications: z.boolean(),
      smsNotifications: z.boolean(),
      pushNotifications: z.boolean(),
      maintenanceAlerts: z.boolean(),
    }),
    system: z.object({
      maintenanceMode: z.boolean(),
      autoBackup: z.boolean(),
      logRetention: z.number().min(1).max(365),
      maxFileSize: z.number().min(1).max(100),
    }),
    application: z.object({
      systemName: z.string().min(1).max(100),
      contactEmail: z.string().email(),
      maxSocieties: z.number().min(1).max(1000),
      defaultLanguage: z.string().min(2).max(5),
    })
  });

  // In-memory system settings storage (in production, this would be in database)
  let systemSettings = {
    security: {
      sessionTimeout: 60,
      enforceStrongPasswords: true,
      enableTwoFactor: false,
      maxLoginAttempts: 5,
    },
    notifications: {
      emailNotifications: true,
      smsNotifications: false,
      pushNotifications: true,
      maintenanceAlerts: true,
    },
    system: {
      maintenanceMode: false,
      autoBackup: true,
      logRetention: 30,
      maxFileSize: 10,
    },
    application: {
      systemName: "SocietyHub",
      contactEmail: "admin@societyhub.com",
      maxSocieties: 100,
      defaultLanguage: "en",
    }
  };

  // System Settings routes (Super Admin only)
  app.get("/api/system/settings", isSimpleAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      if (user?.role !== 'super_admin') {
        return res.status(403).json({ message: "Only super admin can access system settings" });
      }
      
      res.json(systemSettings);
    } catch (error) {
      console.error("Error fetching system settings:", error);
      res.status(500).json({ message: "Failed to fetch system settings" });
    }
  });

  app.put("/api/system/settings", isSimpleAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      if (user?.role !== 'super_admin') {
        return res.status(403).json({ message: "Only super admin can update system settings" });
      }
      
      // Validate the settings payload
      const validationResult = systemSettingsSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          error: 'Invalid settings data',
          details: validationResult.error.issues
        });
      }
      
      // Update the system settings
      systemSettings = validationResult.data;
      
      console.log("System settings updated:", systemSettings);
      res.json(systemSettings);
    } catch (error) {
      console.error("Error updating system settings:", error);
      res.status(500).json({ message: "Failed to update system settings" });
    }
  });

  // In-memory backup storage and progress tracking
  let backupsHistory: any[] = [
    {
      id: 1,
      filename: `societyhub_backup_${new Date(Date.now() - 86400000).toISOString().split('T')[0]}_14-30.sql`,
      date: new Date(Date.now() - 86400000).toISOString(),
      size: "2.3 MB",
      type: "Automatic",
      status: "Success"
    },
    {
      id: 2,
      filename: `societyhub_backup_${new Date(Date.now() - 172800000).toISOString().split('T')[0]}_14-30.sql`,
      date: new Date(Date.now() - 172800000).toISOString(),
      size: "2.2 MB",
      type: "Automatic",
      status: "Success"
    }
  ];
  
  let activeOperations: Map<string, any> = new Map();

  // Backup & Restore routes (Super Admin only)
  app.get("/api/system/backups", isSimpleAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      if (user?.role !== 'super_admin') {
        return res.status(403).json({ message: "Only super admin can access backups" });
      }
      
      res.json(backupsHistory);
    } catch (error) {
      console.error("Error fetching backups:", error);
      res.status(500).json({ message: "Failed to fetch backups" });
    }
  });

  app.post("/api/system/backups", isSimpleAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      if (user?.role !== 'super_admin') {
        return res.status(403).json({ message: "Only super admin can create backups" });
      }
      
      const backupId = Date.now();
      const filename = `societyhub_backup_${new Date().toISOString().split('T')[0]}_${new Date().toTimeString().split(' ')[0].replace(/:/g, '-')}.sql`;
      
      // Create the backup entry
      const backup = {
        id: backupId,
        filename,
        date: new Date().toISOString(),
        size: "0 MB", // Will be updated when complete
        type: "Manual",
        status: "In Progress"
      };
      
      // Add to history and start progress tracking
      backupsHistory.unshift(backup);
      activeOperations.set(`backup_${backupId}`, { 
        type: 'backup', 
        progress: 0, 
        status: 'running',
        startTime: Date.now()
      });
      
      // Simulate backup creation with progress
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 20 + 5; // Random progress increments
        if (progress >= 100) {
          progress = 100;
          clearInterval(interval);
          
          // Mark backup as complete
          const backupIndex = backupsHistory.findIndex(b => b.id === backupId);
          if (backupIndex !== -1) {
            backupsHistory[backupIndex].status = "Success";
            backupsHistory[backupIndex].size = "2.5 MB";
          }
          
          activeOperations.delete(`backup_${backupId}`);
        } else {
          activeOperations.set(`backup_${backupId}`, {
            type: 'backup',
            progress: Math.round(progress),
            status: 'running',
            startTime: activeOperations.get(`backup_${backupId}`)?.startTime
          });
        }
      }, 500);
      
      console.log("Backup creation started:", filename);
      res.json({ message: "Backup creation started", backup, backupId });
    } catch (error) {
      console.error("Error creating backup:", error);
      res.status(500).json({ message: "Failed to create backup" });
    }
  });

  app.get("/api/system/backups/:id/progress", isSimpleAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      if (user?.role !== 'super_admin') {
        return res.status(403).json({ message: "Only super admin can check backup progress" });
      }
      
      const operationKey = `backup_${req.params.id}`;
      const operation = activeOperations.get(operationKey);
      
      if (!operation) {
        return res.status(404).json({ message: "Operation not found or completed" });
      }
      
      res.json(operation);
    } catch (error) {
      console.error("Error checking backup progress:", error);
      res.status(500).json({ message: "Failed to check backup progress" });
    }
  });

  app.get("/api/system/backups/:id/download", isSimpleAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      if (user?.role !== 'super_admin') {
        return res.status(403).json({ message: "Only super admin can download backups" });
      }
      
      const backupId = parseInt(req.params.id);
      const backup = backupsHistory.find(b => b.id === backupId);
      
      if (!backup || backup.status !== "Success") {
        return res.status(404).json({ message: "Backup not found or not ready for download" });
      }
      
      // In a real app, this would serve the actual backup file
      // For now, simulate download initiation
      console.log("Download initiated for backup:", backup.filename);
      res.json({ 
        message: "Backup download initiated", 
        downloadUrl: `/downloads/${backup.filename}`,
        filename: backup.filename 
      });
    } catch (error) {
      console.error("Error downloading backup:", error);
      res.status(500).json({ message: "Failed to download backup" });
    }
  });

  app.post("/api/system/backups/:id/restore", isSimpleAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      if (user?.role !== 'super_admin') {
        return res.status(403).json({ message: "Only super admin can restore backups" });
      }
      
      const backupId = parseInt(req.params.id);
      const backup = backupsHistory.find(b => b.id === backupId);
      
      if (!backup || backup.status !== "Success") {
        return res.status(404).json({ message: "Backup not found or not available for restore" });
      }
      
      const restoreOperationKey = `restore_${backupId}_${Date.now()}`;
      
      // Start restore operation tracking
      activeOperations.set(restoreOperationKey, { 
        type: 'restore', 
        progress: 0, 
        status: 'running',
        backupId,
        startTime: Date.now()
      });
      
      // Simulate database restore with progress
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 15 + 3; // Slower than backup
        if (progress >= 100) {
          progress = 100;
          clearInterval(interval);
          activeOperations.delete(restoreOperationKey);
        } else {
          activeOperations.set(restoreOperationKey, {
            type: 'restore',
            progress: Math.round(progress),
            status: 'running',
            backupId,
            startTime: activeOperations.get(restoreOperationKey)?.startTime
          });
        }
      }, 750);
      
      console.log("Database restore initiated from backup:", backup.filename);
      res.json({ 
        message: "Database restore initiated", 
        backupId,
        restoreOperationId: restoreOperationKey,
        backup 
      });
    } catch (error) {
      console.error("Error restoring backup:", error);
      res.status(500).json({ message: "Failed to restore backup" });
    }
  });

  app.get("/api/system/restore/:operationId/progress", isSimpleAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      if (user?.role !== 'super_admin') {
        return res.status(403).json({ message: "Only super admin can check restore progress" });
      }
      
      const operation = activeOperations.get(req.params.operationId);
      
      if (!operation) {
        return res.status(404).json({ message: "Restore operation not found or completed" });
      }
      
      res.json(operation);
    } catch (error) {
      console.error("Error checking restore progress:", error);
      res.status(500).json({ message: "Failed to check restore progress" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
