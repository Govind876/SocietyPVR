import { useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/layout/navbar";
import { isUnauthorizedError } from "@/lib/authUtils";
import { IndianRupee, AlertCircle, Calendar, Megaphone, CreditCard, UserCog, Vote } from "lucide-react";
import type { SocietyStats, Complaint, Announcement } from "@shared/schema";

export default function ResidentDashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: stats, isLoading: statsLoading } = useQuery<SocietyStats>({
    queryKey: ["/api/dashboard/stats"],
    enabled: isAuthenticated && user?.role === 'resident',
    retry: false,
  });

  const { data: complaints, isLoading: complaintsLoading } = useQuery<Complaint[]>({
    queryKey: ["/api/complaints"],
    enabled: isAuthenticated && user?.role === 'resident',
    retry: false,
  });

  const { data: announcements, isLoading: announcementsLoading } = useQuery<Announcement[]>({
    queryKey: ["/api/announcements"],
    enabled: isAuthenticated && user?.role === 'resident',
    retry: false,
  });

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const quickServices = [
    { icon: AlertCircle, label: "Raise Complaint", color: "from-primary to-accent", href: "/resident" },
    { icon: Vote, label: "Digital Voting", color: "from-green-400 to-green-600", href: "/voting" },
    { icon: Calendar, label: "Book Facility", color: "from-secondary to-accent", href: "/resident" },
    { icon: CreditCard, label: "Pay Dues", color: "from-primary to-secondary", href: "/resident" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Navbar />
      
      <div className="pt-20 px-4 sm:px-6 lg:px-8 pb-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <motion.div
            className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                Welcome Back, <span data-testid="text-user-name">{user?.firstName || "Resident"}</span>
              </h1>
              <p className="text-muted-foreground mt-2" data-testid="text-user-flat">
                Flat {user?.flatNumber || "---"}, {user?.societyId || "Your Society"}
              </p>
            </div>
          </motion.div>
          
          {/* Status Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
            {[
              { 
                title: "Pending Dues", 
                value: `₹${((stats?.pendingDues || 0) / 1000).toFixed(1)}K`, 
                icon: IndianRupee, 
                color: "from-primary to-accent",
                testId: "text-pending-dues"
              },
              { 
                title: "Open Complaints", 
                value: stats?.openComplaints || 0, 
                icon: AlertCircle, 
                color: "from-secondary to-accent",
                testId: "text-open-complaints"
              },
              { 
                title: "Upcoming Bookings", 
                value: stats?.facilityBookings || 0, 
                icon: Calendar, 
                color: "from-primary to-secondary",
                testId: "text-upcoming-bookings"
              },
              { 
                title: "Announcements", 
                value: announcements?.length || 0, 
                icon: Megaphone, 
                color: "from-accent to-primary",
                testId: "text-announcements"
              },
            ].map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                whileHover={{ y: -5 }}
              >
                <Card className="hover:shadow-lg transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">{stat.title}</p>
                        <p className="text-3xl font-bold text-foreground" data-testid={stat.testId}>
                          {statsLoading ? "..." : stat.value}
                        </p>
                      </div>
                      <div className={`w-12 h-12 bg-gradient-to-r ${stat.color} rounded-lg flex items-center justify-center`}>
                        <stat.icon className="h-6 w-6 text-white" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
          
          {/* Quick Services & Recent Announcements */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 mb-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Quick Services</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {quickServices.map((service, index) => (
                      <Button
                        key={index}
                        variant="ghost"
                        className="h-auto p-4 flex flex-col items-center justify-center hover:bg-primary hover:text-white transition-all group"
                        onClick={() => window.location.href = service.href}
                        data-testid={`button-${service.label.toLowerCase().replace(/\s+/g, '-')}`}
                      >
                        <service.icon className="h-6 w-6 mb-2 group-hover:scale-110 transition-transform" />
                        <span className="text-sm font-medium">{service.label}</span>
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Recent Announcements</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {announcementsLoading ? (
                      <div className="text-center text-muted-foreground">Loading announcements...</div>
                    ) : announcements && announcements.length > 0 ? (
                      announcements.slice(0, 3).map((announcement: any, index: number) => (
                        <div key={index} className="p-3 bg-muted rounded-lg">
                          <p className="font-medium text-foreground" data-testid={`text-announcement-title-${index}`}>
                            {announcement.title}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(announcement.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      ))
                    ) : (
                      <div className="text-center text-muted-foreground" data-testid="text-no-announcements">
                        No announcements available
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
          
          {/* Service Modules */}
          <div className="grid lg:grid-cols-3 gap-6">
            {[
              {
                title: "My Complaints",
                description: "Track your complaints and service requests status.",
                icon: AlertCircle,
                buttonText: "View Complaints",
                color: "from-primary to-accent",
                testId: "button-view-complaints"
              },
              {
                title: "My Bookings",
                description: "Manage your facility bookings and check availability.",
                icon: Calendar,
                buttonText: "Manage Bookings",
                color: "from-secondary to-accent",
                testId: "button-manage-bookings"
              },
              {
                title: "Payment History",
                description: "View payment history and download receipts.",
                icon: CreditCard,
                buttonText: "View History",
                color: "from-accent to-primary",
                testId: "button-view-history"
              },
            ].map((module, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.7 + index * 0.1 }}
                whileHover={{ y: -5 }}
              >
                <Card className="h-full hover:shadow-lg transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-foreground">{module.title}</h3>
                      <module.icon className="h-6 w-6 text-primary" />
                    </div>
                    <p className="text-muted-foreground mb-4">{module.description}</p>
                    <Button 
                      className={`w-full bg-gradient-to-r ${module.color} text-white hover:opacity-90 transition-opacity`}
                      data-testid={module.testId}
                    >
                      {module.buttonText}
                    </Button>
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
