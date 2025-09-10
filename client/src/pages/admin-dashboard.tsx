import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/layout/navbar";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Users, AlertTriangle, IndianRupee, Calendar, UserPlus, Megaphone, FileText, TrendingUp, Vote } from "lucide-react";
import type { SocietyStats, Complaint, Announcement } from "@shared/schema";
import { AddResidentModal } from "@/components/admin/add-resident-modal";

export default function AdminDashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();
  const [showAddResidentModal, setShowAddResidentModal] = useState(false);

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
    enabled: isAuthenticated && user?.role === 'admin',
    retry: false,
  });

  const { data: complaints, isLoading: complaintsLoading } = useQuery<Complaint[]>({
    queryKey: ["/api/complaints"],
    enabled: isAuthenticated && user?.role === 'admin',
    retry: false,
  });

  const { data: announcements, isLoading: announcementsLoading } = useQuery<Announcement[]>({
    queryKey: ["/api/announcements"],
    enabled: isAuthenticated && user?.role === 'admin',
    retry: false,
  });

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const quickActions = [
    { icon: UserPlus, label: "Add Resident", color: "from-primary to-accent", action: () => setShowAddResidentModal(true) },
    { icon: Vote, label: "Digital Voting", color: "from-green-400 to-green-600", href: "/voting" },
    { icon: Megaphone, label: "New Announcement", color: "from-secondary to-accent", href: "/admin" },
    { icon: TrendingUp, label: "View Reports", color: "from-accent to-primary", href: "/admin" },
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
              <h1 className="text-2xl md:text-3xl font-bold text-foreground" data-testid="text-admin-dashboard">Admin Dashboard</h1>
              <p className="text-muted-foreground mt-2">Manage your society efficiently</p>
            </div>
          </motion.div>
          
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
            {[
              { 
                title: "Total Residents", 
                value: stats?.totalResidents || 0, 
                icon: Users, 
                color: "from-primary to-accent",
                testId: "text-total-residents"
              },
              { 
                title: "Open Complaints", 
                value: stats?.openComplaints || 0, 
                icon: AlertTriangle, 
                color: "from-secondary to-accent",
                testId: "text-open-complaints"
              },
              { 
                title: "Monthly Revenue", 
                value: `₹${((stats?.pendingDues || 0) / 1000).toFixed(1)}K`, 
                icon: IndianRupee, 
                color: "from-primary to-secondary",
                testId: "text-monthly-revenue"
              },
              { 
                title: "Facility Bookings", 
                value: stats?.facilityBookings || 0, 
                icon: Calendar, 
                color: "from-accent to-primary",
                testId: "text-facility-bookings"
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
          
          {/* Quick Actions & Recent Complaints */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 mb-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {quickActions.map((action, index) => (
                      <Button
                        key={index}
                        variant="ghost"
                        className="h-auto p-4 flex flex-col items-center justify-center hover:bg-primary hover:text-white transition-all group"
                        onClick={() => action.action ? action.action() : window.location.href = action.href}
                        data-testid={`button-${action.label.toLowerCase().replace(/\s+/g, '-')}`}
                      >
                        <action.icon className="h-6 w-6 mb-2 group-hover:scale-110 transition-transform" />
                        <span className="text-sm font-medium">{action.label}</span>
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
                  <CardTitle>Recent Complaints</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {complaintsLoading ? (
                      <div className="text-center text-muted-foreground">Loading complaints...</div>
                    ) : complaints && complaints.length > 0 ? (
                      complaints.slice(0, 3).map((complaint: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                          <div>
                            <p className="font-medium text-foreground" data-testid={`text-complaint-title-${index}`}>
                              {complaint.title}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {complaint.category} • {new Date(complaint.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <Badge 
                            variant={complaint.status === 'open' ? 'destructive' : complaint.status === 'in_progress' ? 'default' : 'secondary'}
                            data-testid={`badge-complaint-status-${index}`}
                          >
                            {complaint.status.replace('_', ' ')}
                          </Badge>
                        </div>
                      ))
                    ) : (
                      <div className="text-center text-muted-foreground" data-testid="text-no-complaints">
                        No complaints found
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
          
          {/* Management Modules */}
          <div className="grid lg:grid-cols-3 gap-6">
            {[
              {
                title: "Resident Management",
                description: "Manage resident profiles, flat assignments, and occupancy status.",
                icon: Users,
                buttonText: "Manage Residents",
                color: "from-primary to-accent",
                testId: "button-manage-residents",
                href: "/manage-residents"
              },
              {
                title: "Facility Booking",
                description: "Approve bookings and manage facility schedules and availability.",
                icon: Calendar,
                buttonText: "View Bookings",
                color: "from-secondary to-accent",
                testId: "button-view-bookings"
              },
              {
                title: "Financial Reports",
                description: "Generate detailed financial and operational reports.",
                icon: TrendingUp,
                buttonText: "Generate Reports",
                color: "from-accent to-primary",
                testId: "button-generate-reports"
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
                      onClick={() => module.href ? window.location.href = module.href : undefined}
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

      {/* Add Resident Modal */}
      <AddResidentModal
        isOpen={showAddResidentModal}
        onClose={() => setShowAddResidentModal(false)}
      />
    </div>
  );
}
