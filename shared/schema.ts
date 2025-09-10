import { sql } from 'drizzle-orm';
import { relations } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  boolean,
  pgEnum,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User roles enum
export const userRoleEnum = pgEnum('user_role', ['super_admin', 'admin', 'resident']);

// Complaint status enum
export const complaintStatusEnum = pgEnum('complaint_status', ['open', 'in_progress', 'resolved', 'closed']);

// Facility booking status enum
export const bookingStatusEnum = pgEnum('booking_status', ['pending', 'approved', 'rejected', 'cancelled']);

// User storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: userRoleEnum("role").default('resident'),
  societyId: varchar("society_id"),
  flatNumber: varchar("flat_number"),
  phoneNumber: varchar("phone_number"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Societies table
export const societies = pgTable("societies", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  address: text("address").notNull(),
  adminId: varchar("admin_id"),
  totalFlats: integer("total_flats").default(0),
  totalParkingSlots: integer("total_parking_slots").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Flats table
export const flats = pgTable("flats", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  flatNumber: varchar("flat_number").notNull(),
  societyId: varchar("society_id").notNull(),
  residentId: varchar("resident_id"),
  isOccupied: boolean("is_occupied").default(false),
  bedrooms: integer("bedrooms").default(1),
  area: integer("area"), // in sq ft
  createdAt: timestamp("created_at").defaultNow(),
});

// Complaints table
export const complaints = pgTable("complaints", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title").notNull(),
  description: text("description").notNull(),
  category: varchar("category").notNull(), // plumbing, electrical, security, etc.
  status: complaintStatusEnum("status").default('open'),
  priority: varchar("priority").default('medium'), // low, medium, high
  residentId: varchar("resident_id").notNull(),
  societyId: varchar("society_id").notNull(),
  assignedTo: varchar("assigned_to"), // staff/vendor id
  resolutionNotes: text("resolution_notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  resolvedAt: timestamp("resolved_at"),
});

// Facilities table
export const facilities = pgTable("facilities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  societyId: varchar("society_id").notNull(),
  description: text("description"),
  capacity: integer("capacity").default(1),
  isAvailable: boolean("is_available").default(true),
  hourlyRate: integer("hourly_rate").default(0), // in rupees
  createdAt: timestamp("created_at").defaultNow(),
});

// Facility bookings table
export const facilityBookings = pgTable("facility_bookings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  facilityId: varchar("facility_id").notNull(),
  residentId: varchar("resident_id").notNull(),
  societyId: varchar("society_id").notNull(),
  bookingDate: timestamp("booking_date").notNull(),
  startTime: varchar("start_time").notNull(),
  endTime: varchar("end_time").notNull(),
  status: bookingStatusEnum("status").default('pending'),
  totalAmount: integer("total_amount").default(0),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Announcements table
export const announcements = pgTable("announcements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title").notNull(),
  content: text("content").notNull(),
  societyId: varchar("society_id").notNull(),
  authorId: varchar("author_id").notNull(),
  isUrgent: boolean("is_urgent").default(false),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Maintenance bills table
export const maintenanceBills = pgTable("maintenance_bills", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  residentId: varchar("resident_id").notNull(),
  societyId: varchar("society_id").notNull(),
  amount: integer("amount").notNull(),
  dueDate: timestamp("due_date").notNull(),
  isPaid: boolean("is_paid").default(false),
  paidAt: timestamp("paid_at"),
  billingMonth: varchar("billing_month").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  society: one(societies, {
    fields: [users.societyId],
    references: [societies.id],
  }),
  complaints: many(complaints),
  facilityBookings: many(facilityBookings),
  announcements: many(announcements),
  maintenanceBills: many(maintenanceBills),
}));

export const societiesRelations = relations(societies, ({ one, many }) => ({
  admin: one(users, {
    fields: [societies.adminId],
    references: [users.id],
  }),
  residents: many(users),
  flats: many(flats),
  complaints: many(complaints),
  facilities: many(facilities),
  facilityBookings: many(facilityBookings),
  announcements: many(announcements),
  maintenanceBills: many(maintenanceBills),
}));

export const flatsRelations = relations(flats, ({ one }) => ({
  society: one(societies, {
    fields: [flats.societyId],
    references: [societies.id],
  }),
  resident: one(users, {
    fields: [flats.residentId],
    references: [users.id],
  }),
}));

export const complaintsRelations = relations(complaints, ({ one }) => ({
  resident: one(users, {
    fields: [complaints.residentId],
    references: [users.id],
  }),
  society: one(societies, {
    fields: [complaints.societyId],
    references: [societies.id],
  }),
}));

export const facilitiesRelations = relations(facilities, ({ one, many }) => ({
  society: one(societies, {
    fields: [facilities.societyId],
    references: [societies.id],
  }),
  bookings: many(facilityBookings),
}));

export const facilityBookingsRelations = relations(facilityBookings, ({ one }) => ({
  facility: one(facilities, {
    fields: [facilityBookings.facilityId],
    references: [facilities.id],
  }),
  resident: one(users, {
    fields: [facilityBookings.residentId],
    references: [users.id],
  }),
  society: one(societies, {
    fields: [facilityBookings.societyId],
    references: [societies.id],
  }),
}));

export const announcementsRelations = relations(announcements, ({ one }) => ({
  society: one(societies, {
    fields: [announcements.societyId],
    references: [societies.id],
  }),
  author: one(users, {
    fields: [announcements.authorId],
    references: [users.id],
  }),
}));

export const maintenanceBillsRelations = relations(maintenanceBills, ({ one }) => ({
  resident: one(users, {
    fields: [maintenanceBills.residentId],
    references: [users.id],
  }),
  society: one(societies, {
    fields: [maintenanceBills.societyId],
    references: [societies.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSocietySchema = createInsertSchema(societies).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertComplaintSchema = createInsertSchema(complaints).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  resolvedAt: true,
});

export const insertFacilityBookingSchema = createInsertSchema(facilityBookings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAnnouncementSchema = createInsertSchema(announcements).omit({
  id: true,
  createdAt: true,
});

// Auth user schema (allows setting ID for Replit Auth)
export const upsertUserSchema = createInsertSchema(users).omit({
  createdAt: true,
  updatedAt: true,
});

// Types
export type UpsertUser = z.infer<typeof upsertUserSchema>;
export type User = typeof users.$inferSelect;
export type Society = typeof societies.$inferSelect;
export type Flat = typeof flats.$inferSelect;
export type Complaint = typeof complaints.$inferSelect;
export type Facility = typeof facilities.$inferSelect;
export type FacilityBooking = typeof facilityBookings.$inferSelect;
export type Announcement = typeof announcements.$inferSelect;
export type MaintenanceBill = typeof maintenanceBills.$inferSelect;

export type InsertSociety = z.infer<typeof insertSocietySchema>;
export type InsertComplaint = z.infer<typeof insertComplaintSchema>;
export type InsertFacilityBooking = z.infer<typeof insertFacilityBookingSchema>;
export type InsertAnnouncement = z.infer<typeof insertAnnouncementSchema>;

// API Response Types
export interface SocietyStats {
  totalResidents: number;
  openComplaints: number;
  facilityBookings: number;
  pendingDues: number;
}

export interface GlobalStats {
  totalSocieties: number;
  totalUsers: number;
  totalRevenue: number;
  systemHealth: number;
}
