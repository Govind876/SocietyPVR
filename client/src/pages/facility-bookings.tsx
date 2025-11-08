import { useState } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/layout/navbar";
import { Calendar, Clock, User, MapPin, ArrowLeft, CheckCircle, XCircle } from "lucide-react";
import { useLocation } from "wouter";

interface Booking {
  id: number;
  facility: string;
  resident: string;
  flatNumber: string;
  date: string;
  time: string;
  status: "pending" | "approved" | "rejected";
  amount: string;
}

export default function FacilityBookings() {
  const [, setLocation] = useLocation();
  const [selectedStatus, setSelectedStatus] = useState<"all" | "pending" | "approved" | "rejected">("all");

  const mockBookings: Booking[] = [
    { id: 1, facility: "Clubhouse", resident: "Rajesh Kumar", flatNumber: "A-101", date: "2024-11-15", time: "10:00 AM - 2:00 PM", status: "pending", amount: "₹1,500" },
    { id: 2, facility: "Swimming Pool", resident: "Priya Sharma", flatNumber: "B-203", date: "2024-11-16", time: "6:00 AM - 8:00 AM", status: "approved", amount: "₹500" },
    { id: 3, facility: "Gym", resident: "Amit Patel", flatNumber: "C-305", date: "2024-11-17", time: "5:00 PM - 7:00 PM", status: "pending", amount: "₹300" },
    { id: 4, facility: "Banquet Hall", resident: "Sneha Reddy", flatNumber: "A-402", date: "2024-11-20", time: "7:00 PM - 11:00 PM", status: "approved", amount: "₹3,000" },
    { id: 5, facility: "Tennis Court", resident: "Vikram Singh", flatNumber: "B-108", date: "2024-11-18", time: "4:00 PM - 6:00 PM", status: "rejected", amount: "₹400" },
  ];

  const filteredBookings = selectedStatus === "all" 
    ? mockBookings 
    : mockBookings.filter(b => b.status === selectedStatus);

  const stats = {
    total: mockBookings.length,
    pending: mockBookings.filter(b => b.status === "pending").length,
    approved: mockBookings.filter(b => b.status === "approved").length,
    rejected: mockBookings.filter(b => b.status === "rejected").length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Navbar />
      
      <div className="pt-20 px-4 sm:px-6 lg:px-8 pb-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="flex items-center justify-between mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={() => setLocation("/admin")}
                data-testid="button-back-to-dashboard"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-foreground" data-testid="text-facility-bookings-title">
                  Facility Bookings
                </h1>
                <p className="text-muted-foreground mt-2">Manage and approve facility booking requests</p>
              </div>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
            {[
              { label: "All Bookings", value: stats.total, status: "all" },
              { label: "Pending", value: stats.pending, status: "pending" },
              { label: "Approved", value: stats.approved, status: "approved" },
              { label: "Rejected", value: stats.rejected, status: "rejected" },
            ].map((stat, index) => (
              <motion.div
                key={stat.status}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Card 
                  className={`cursor-pointer transition-all duration-300 ${selectedStatus === stat.status ? 'ring-2 ring-primary' : 'hover:shadow-lg'}`}
                  onClick={() => setSelectedStatus(stat.status as any)}
                  data-testid={`card-filter-${stat.status}`}
                >
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl font-bold text-foreground" data-testid={`text-${stat.status}-count`}>{stat.value}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <div className="space-y-4">
            {filteredBookings.map((booking, index) => (
              <motion.div
                key={booking.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.05 }}
              >
                <Card>
                  <CardContent className="p-6">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div className="flex-1 min-w-[200px]">
                        <div className="flex items-center gap-2 mb-2">
                          <MapPin className="h-4 w-4 text-primary" />
                          <h3 className="font-semibold text-lg text-foreground" data-testid={`text-booking-facility-${booking.id}`}>
                            {booking.facility}
                          </h3>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {booking.resident} ({booking.flatNumber})
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {booking.date}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {booking.time}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Amount</p>
                          <p className="text-lg font-semibold text-foreground" data-testid={`text-booking-amount-${booking.id}`}>
                            {booking.amount}
                          </p>
                        </div>

                        <Badge 
                          variant={booking.status === "approved" ? "default" : booking.status === "rejected" ? "destructive" : "secondary"}
                          data-testid={`badge-booking-status-${booking.id}`}
                        >
                          {booking.status}
                        </Badge>

                        {booking.status === "pending" && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="default"
                              data-testid={`button-approve-${booking.id}`}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              data-testid={`button-reject-${booking.id}`}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
