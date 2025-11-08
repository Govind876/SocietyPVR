import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/layout/navbar";
import { Calendar, Clock, MapPin, ArrowLeft, X } from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

interface Booking {
  id: number;
  facility: string;
  date: string;
  time: string;
  status: "upcoming" | "completed" | "cancelled";
  amount: string;
}

export default function MyBookings() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedFilter, setSelectedFilter] = useState<"all" | "upcoming" | "completed" | "cancelled">("all");

  const bookings: Booking[] = [
    { id: 1, facility: "Clubhouse", date: "2024-11-20", time: "10:00 AM - 2:00 PM", status: "upcoming", amount: "₹1,500" },
    { id: 2, facility: "Swimming Pool", date: "2024-11-15", time: "6:00 AM - 8:00 AM", status: "completed", amount: "₹500" },
    { id: 3, facility: "Tennis Court", date: "2024-11-25", time: "4:00 PM - 6:00 PM", status: "upcoming", amount: "₹400" },
    { id: 4, facility: "Gym", date: "2024-11-10", time: "5:00 PM - 7:00 PM", status: "completed", amount: "₹300" },
    { id: 5, facility: "Banquet Hall", date: "2024-11-05", time: "7:00 PM - 11:00 PM", status: "cancelled", amount: "₹3,000" },
  ];

  const filteredBookings = selectedFilter === "all" 
    ? bookings 
    : bookings.filter(b => b.status === selectedFilter);

  const stats = {
    total: bookings.length,
    upcoming: bookings.filter(b => b.status === "upcoming").length,
    completed: bookings.filter(b => b.status === "completed").length,
    cancelled: bookings.filter(b => b.status === "cancelled").length,
  };

  const handleCancelBooking = (id: number) => {
    toast({
      title: "Booking Cancelled",
      description: "Your facility booking has been cancelled successfully.",
    });
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
                onClick={() => setLocation("/resident")}
                data-testid="button-back-to-dashboard"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-foreground" data-testid="text-my-bookings-title">
                  My Bookings
                </h1>
                <p className="text-muted-foreground mt-2">View and manage your facility bookings</p>
              </div>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
            {[
              { label: "All Bookings", value: stats.total, filter: "all" },
              { label: "Upcoming", value: stats.upcoming, filter: "upcoming" },
              { label: "Completed", value: stats.completed, filter: "completed" },
              { label: "Cancelled", value: stats.cancelled, filter: "cancelled" },
            ].map((stat, index) => (
              <motion.div
                key={stat.filter}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Card 
                  className={`cursor-pointer transition-all duration-300 ${selectedFilter === stat.filter ? 'ring-2 ring-primary' : 'hover:shadow-lg'}`}
                  onClick={() => setSelectedFilter(stat.filter as any)}
                  data-testid={`card-filter-${stat.filter}`}
                >
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl font-bold text-foreground" data-testid={`text-${stat.filter}-count`}>{stat.value}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredBookings.map((booking, index) => (
              <motion.div
                key={booking.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.05 }}
              >
                <Card className="hover:shadow-lg transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-primary" />
                        <h3 className="font-semibold text-lg text-foreground" data-testid={`text-booking-facility-${booking.id}`}>
                          {booking.facility}
                        </h3>
                      </div>
                      <Badge 
                        variant={booking.status === "upcoming" ? "default" : booking.status === "completed" ? "secondary" : "destructive"}
                        data-testid={`badge-booking-status-${booking.id}`}
                      >
                        {booking.status}
                      </Badge>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>{booking.date}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>{booking.time}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t">
                      <span className="text-lg font-semibold text-foreground" data-testid={`text-booking-amount-${booking.id}`}>
                        {booking.amount}
                      </span>
                      {booking.status === "upcoming" && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleCancelBooking(booking.id)}
                          data-testid={`button-cancel-${booking.id}`}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Cancel
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {filteredBookings.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <Calendar className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground" data-testid="text-no-bookings">
                  No {selectedFilter !== "all" ? selectedFilter : ""} bookings found
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
