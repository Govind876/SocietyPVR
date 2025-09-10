import {
  users,
  societies,
  flats,
  complaints,
  facilities,
  facilityBookings,
  announcements,
  maintenanceBills,
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
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, count, sql } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations (IMPORTANT) mandatory for Replit Auth
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
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
}

export const storage = new DatabaseStorage();
