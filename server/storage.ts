import {
  users,
  societies,
  flats,
  complaints,
  facilities,
  facilityBookings,
  announcements,
  maintenanceBills,
  polls,
  pollOptions,
  votes,
  marketplaceItems,
  type User,
  type UpsertUser,
  type Society,
  type InsertSociety,
  type Complaint,
  type InsertComplaint,
  type Facility,
  type FacilityBooking,
  type InsertFacilityBooking,
  type Announcement,
  type InsertAnnouncement,
  type MaintenanceBill,
  type Flat,
  type Poll,
  type PollOption,
  type Vote,
  type InsertPoll,
  type InsertPollOption,
  type InsertVote,
  type PollWithOptions,
  type MarketplaceItem,
  type InsertMarketplaceItem,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, count, sql } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations (IMPORTANT) mandatory for Replit Auth
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Simple auth operations
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(userData: Omit<UpsertUser, 'id'>): Promise<User>;
  
  // Society operations
  createSociety(society: InsertSociety): Promise<Society>;
  getSocieties(): Promise<Society[]>;
  getSociety(id: string): Promise<Society | undefined>;
  updateSociety(id: string, updates: Partial<InsertSociety>): Promise<Society>;
  deleteSociety(id: string): Promise<void>;
  
  // Residents management
  getResidentsBySociety(societyId: string): Promise<User[]>;
  assignResidentToFlat(residentId: string, flatNumber: string, societyId: string): Promise<void>;
  
  // Complaints operations
  createComplaint(complaint: InsertComplaint): Promise<Complaint>;
  getComplaintsBySociety(societyId: string): Promise<Complaint[]>;
  getComplaintsByResident(residentId: string): Promise<Complaint[]>;
  updateComplaintStatus(id: string, status: string, resolutionNotes?: string): Promise<Complaint>;
  
  // Facility operations
  getFacilitiesBySociety(societyId: string): Promise<Facility[]>;
  createFacilityBooking(booking: InsertFacilityBooking): Promise<FacilityBooking>;
  getFacilityBookings(societyId: string): Promise<FacilityBooking[]>;
  getResidentBookings(residentId: string): Promise<FacilityBooking[]>;
  updateBookingStatus(id: string, status: string): Promise<FacilityBooking>;
  
  // Announcements operations
  createAnnouncement(announcement: InsertAnnouncement): Promise<Announcement>;
  getAnnouncementsBySociety(societyId: string): Promise<Announcement[]>;
  
  // Dashboard stats
  getSocietyStats(societyId: string): Promise<{
    totalResidents: number;
    openComplaints: number;
    facilityBookings: number;
    pendingDues: number;
  }>;
  
  getGlobalStats(): Promise<{
    totalSocieties: number;
    totalUsers: number;
    totalRevenue: number;
    systemHealth: number;
  }>;
  
  // Voting operations
  createPoll(poll: InsertPoll): Promise<Poll>;
  getPollsBySociety(societyId: string): Promise<PollWithOptions[]>;
  getPoll(pollId: string): Promise<PollWithOptions | undefined>;
  updatePollStatus(pollId: string, status: string): Promise<Poll>;
  createPollOption(option: InsertPollOption): Promise<PollOption>;
  castVote(vote: InsertVote): Promise<Vote>;
  getUserVote(pollId: string, userId: string): Promise<Vote[]>;
  hasUserVoted(pollId: string, userId: string): Promise<boolean>;
  getPollResults(pollId: string): Promise<{ optionId: string; optionText: string; voteCount: number }[]>;
  
  // Marketplace operations
  createMarketplaceItem(item: InsertMarketplaceItem): Promise<MarketplaceItem>;
  getMarketplaceItemsBySociety(societyId: string): Promise<MarketplaceItem[]>;
  getMarketplaceItemsBySeller(sellerId: string): Promise<MarketplaceItem[]>;
  getMarketplaceItem(id: string): Promise<MarketplaceItem | undefined>;
  updateMarketplaceItemStatus(id: string, status: string): Promise<MarketplaceItem>;
  updateMarketplaceItem(id: string, updates: Partial<InsertMarketplaceItem>): Promise<MarketplaceItem>;
  deleteMarketplaceItem(id: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User operations (IMPORTANT) mandatory for Replit Auth
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Simple auth operations
  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(userData: Omit<UpsertUser, 'id'>): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        ...userData,
        id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, // Generate simple ID
      })
      .returning();
    return user;
  }

  // Society operations
  async createSociety(society: InsertSociety): Promise<Society> {
    const [newSociety] = await db.insert(societies).values(society).returning();
    return newSociety;
  }

  async getSocieties(): Promise<Society[]> {
    return await db.select().from(societies).orderBy(desc(societies.createdAt));
  }

  async getSociety(id: string): Promise<Society | undefined> {
    const [society] = await db.select().from(societies).where(eq(societies.id, id));
    return society;
  }

  async updateSociety(id: string, updates: Partial<InsertSociety>): Promise<Society> {
    const [updated] = await db
      .update(societies)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(societies.id, id))
      .returning();
    return updated;
  }

  async deleteSociety(id: string): Promise<void> {
    await db.delete(societies).where(eq(societies.id, id));
  }

  // Residents management
  async getResidentsBySociety(societyId: string): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .where(and(eq(users.societyId, societyId), eq(users.role, 'resident')));
  }

  async assignResidentToFlat(residentId: string, flatNumber: string, societyId: string): Promise<void> {
    await db
      .update(users)
      .set({ flatNumber, societyId })
      .where(eq(users.id, residentId));
  }

  // Complaints operations
  async createComplaint(complaint: InsertComplaint): Promise<Complaint> {
    const [newComplaint] = await db.insert(complaints).values(complaint).returning();
    return newComplaint;
  }

  async getComplaintsBySociety(societyId: string): Promise<Complaint[]> {
    return await db
      .select()
      .from(complaints)
      .where(eq(complaints.societyId, societyId))
      .orderBy(desc(complaints.createdAt));
  }

  async getComplaintsByResident(residentId: string): Promise<Complaint[]> {
    return await db
      .select()
      .from(complaints)
      .where(eq(complaints.residentId, residentId))
      .orderBy(desc(complaints.createdAt));
  }

  async updateComplaintStatus(id: string, status: string, resolutionNotes?: string): Promise<Complaint> {
    const updates: any = { status, updatedAt: new Date() };
    if (status === 'resolved' || status === 'closed') {
      updates.resolvedAt = new Date();
      if (resolutionNotes) {
        updates.resolutionNotes = resolutionNotes;
      }
    }

    const [updated] = await db
      .update(complaints)
      .set(updates)
      .where(eq(complaints.id, id))
      .returning();
    return updated;
  }

  // Facility operations
  async getFacilitiesBySociety(societyId: string): Promise<Facility[]> {
    return await db
      .select()
      .from(facilities)
      .where(eq(facilities.societyId, societyId));
  }

  async createFacilityBooking(booking: InsertFacilityBooking): Promise<FacilityBooking> {
    const [newBooking] = await db.insert(facilityBookings).values(booking).returning();
    return newBooking;
  }

  async getFacilityBookings(societyId: string): Promise<FacilityBooking[]> {
    return await db
      .select()
      .from(facilityBookings)
      .where(eq(facilityBookings.societyId, societyId))
      .orderBy(desc(facilityBookings.createdAt));
  }

  async getResidentBookings(residentId: string): Promise<FacilityBooking[]> {
    return await db
      .select()
      .from(facilityBookings)
      .where(eq(facilityBookings.residentId, residentId))
      .orderBy(desc(facilityBookings.createdAt));
  }

  async updateBookingStatus(id: string, status: string): Promise<FacilityBooking> {
    const [updated] = await db
      .update(facilityBookings)
      .set({ status: status as any, updatedAt: new Date() })
      .where(eq(facilityBookings.id, id))
      .returning();
    return updated;
  }

  // Announcements operations
  async createAnnouncement(announcement: InsertAnnouncement): Promise<Announcement> {
    const [newAnnouncement] = await db.insert(announcements).values(announcement).returning();
    return newAnnouncement;
  }

  async getAnnouncementsBySociety(societyId: string): Promise<Announcement[]> {
    return await db
      .select()
      .from(announcements)
      .where(eq(announcements.societyId, societyId))
      .orderBy(desc(announcements.createdAt));
  }

  // Dashboard stats
  async getSocietyStats(societyId: string): Promise<{
    totalResidents: number;
    openComplaints: number;
    facilityBookings: number;
    pendingDues: number;
  }> {
    const [residentsCount] = await db
      .select({ count: count() })
      .from(users)
      .where(and(eq(users.societyId, societyId), eq(users.role, 'resident')));

    const [complaintsCount] = await db
      .select({ count: count() })
      .from(complaints)
      .where(and(eq(complaints.societyId, societyId), eq(complaints.status, 'open')));

    const [bookingsCount] = await db
      .select({ count: count() })
      .from(facilityBookings)
      .where(eq(facilityBookings.societyId, societyId));

    const [duesSum] = await db
      .select({ total: sql<number>`COALESCE(SUM(${maintenanceBills.amount}), 0)` })
      .from(maintenanceBills)
      .where(and(eq(maintenanceBills.societyId, societyId), eq(maintenanceBills.isPaid, false)));

    return {
      totalResidents: residentsCount.count,
      openComplaints: complaintsCount.count,
      facilityBookings: bookingsCount.count,
      pendingDues: Number(duesSum.total),
    };
  }

  async getGlobalStats(): Promise<{
    totalSocieties: number;
    totalUsers: number;
    totalRevenue: number;
    systemHealth: number;
  }> {
    const [societiesCount] = await db.select({ count: count() }).from(societies);
    const [usersCount] = await db.select({ count: count() }).from(users);
    
    const [revenueSum] = await db
      .select({ total: sql<number>`COALESCE(SUM(${maintenanceBills.amount}), 0)` })
      .from(maintenanceBills)
      .where(eq(maintenanceBills.isPaid, true));

    return {
      totalSocieties: societiesCount.count,
      totalUsers: usersCount.count,
      totalRevenue: Number(revenueSum.total),
      systemHealth: 98, // Mock system health percentage
    };
  }

  // Voting operations
  async createPoll(pollData: InsertPoll): Promise<Poll> {
    const [poll] = await db.insert(polls).values(pollData).returning();
    return poll;
  }

  async getPollsBySociety(societyId: string): Promise<PollWithOptions[]> {
    const pollsWithOptions = await db
      .select({
        poll: polls,
        option: pollOptions,
      })
      .from(polls)
      .leftJoin(pollOptions, eq(polls.id, pollOptions.pollId))
      .where(eq(polls.societyId, societyId))
      .orderBy(desc(polls.createdAt));

    // Group by poll
    const pollMap = new Map<string, PollWithOptions>();
    
    for (const row of pollsWithOptions) {
      if (!pollMap.has(row.poll.id)) {
        pollMap.set(row.poll.id, {
          ...row.poll,
          options: [],
          voteCount: 0,
        });
      }
      
      if (row.option) {
        pollMap.get(row.poll.id)!.options.push(row.option);
      }
    }

    // Get vote counts for each poll
    for (const [pollId, poll] of pollMap) {
      const [voteCount] = await db
        .select({ count: count() })
        .from(votes)
        .where(eq(votes.pollId, pollId));
      poll.voteCount = voteCount.count;
    }

    return Array.from(pollMap.values());
  }

  async getPoll(pollId: string): Promise<PollWithOptions | undefined> {
    const [poll] = await db.select().from(polls).where(eq(polls.id, pollId));
    if (!poll) return undefined;

    const options = await db
      .select()
      .from(pollOptions)
      .where(eq(pollOptions.pollId, pollId))
      .orderBy(pollOptions.orderIndex);

    const [voteCount] = await db
      .select({ count: count() })
      .from(votes)
      .where(eq(votes.pollId, pollId));

    return {
      ...poll,
      options,
      voteCount: voteCount.count,
    };
  }

  async updatePollStatus(pollId: string, status: string): Promise<Poll> {
    const [updated] = await db
      .update(polls)
      .set({ status: status as any, updatedAt: new Date() })
      .where(eq(polls.id, pollId))
      .returning();
    return updated;
  }

  async createPollOption(optionData: InsertPollOption): Promise<PollOption> {
    const [option] = await db.insert(pollOptions).values(optionData).returning();
    return option;
  }

  async castVote(voteData: InsertVote): Promise<Vote> {
    // Check if user already voted for this poll
    const existingVote = await db
      .select()
      .from(votes)
      .where(and(eq(votes.pollId, voteData.pollId), eq(votes.voterId, voteData.voterId)));

    if (existingVote.length > 0) {
      throw new Error("User has already voted for this poll");
    }

    const [vote] = await db.insert(votes).values(voteData).returning();
    return vote;
  }

  async getUserVote(pollId: string, userId: string): Promise<Vote[]> {
    return await db
      .select()
      .from(votes)
      .where(and(eq(votes.pollId, pollId), eq(votes.voterId, userId)));
  }

  async hasUserVoted(pollId: string, userId: string): Promise<boolean> {
    const userVotes = await this.getUserVote(pollId, userId);
    return userVotes.length > 0;
  }

  async getPollResults(pollId: string): Promise<{ optionId: string; optionText: string; voteCount: number }[]> {
    const results = await db
      .select({
        optionId: pollOptions.id,
        optionText: pollOptions.optionText,
        voteCount: count(votes.id),
      })
      .from(pollOptions)
      .leftJoin(votes, eq(pollOptions.id, votes.optionId))
      .where(eq(pollOptions.pollId, pollId))
      .groupBy(pollOptions.id, pollOptions.optionText)
      .orderBy(pollOptions.orderIndex);

    return results.map(result => ({
      optionId: result.optionId,
      optionText: result.optionText,
      voteCount: Number(result.voteCount),
    }));
  }

  // Marketplace operations
  async createMarketplaceItem(item: InsertMarketplaceItem): Promise<MarketplaceItem> {
    const [marketplaceItem] = await db.insert(marketplaceItems).values(item).returning();
    return marketplaceItem;
  }

  async getMarketplaceItemsBySociety(societyId: string): Promise<MarketplaceItem[]> {
    return await db
      .select()
      .from(marketplaceItems)
      .where(and(eq(marketplaceItems.societyId, societyId), eq(marketplaceItems.status, "active")))
      .orderBy(desc(marketplaceItems.createdAt));
  }

  async getMarketplaceItemsBySeller(sellerId: string): Promise<MarketplaceItem[]> {
    return await db
      .select()
      .from(marketplaceItems)
      .where(eq(marketplaceItems.sellerId, sellerId))
      .orderBy(desc(marketplaceItems.createdAt));
  }

  async getMarketplaceItem(id: string): Promise<MarketplaceItem | undefined> {
    const [item] = await db.select().from(marketplaceItems).where(eq(marketplaceItems.id, id));
    return item;
  }

  async updateMarketplaceItemStatus(id: string, status: string): Promise<MarketplaceItem> {
    const [item] = await db
      .update(marketplaceItems)
      .set({ status: status as any, updatedAt: new Date() })
      .where(eq(marketplaceItems.id, id))
      .returning();
    return item;
  }

  async updateMarketplaceItem(id: string, updates: Partial<InsertMarketplaceItem>): Promise<MarketplaceItem> {
    const [item] = await db
      .update(marketplaceItems)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(marketplaceItems.id, id))
      .returning();
    return item;
  }

  async deleteMarketplaceItem(id: string): Promise<void> {
    await db.delete(marketplaceItems).where(eq(marketplaceItems.id, id));
  }
}

export const storage = new DatabaseStorage();
