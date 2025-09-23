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
import { Building, Users, TrendingUp, Server, PlusCircle, ShieldQuestion, Settings, Database } from "lucide-react";
import { CreateSocietyModal } from "@/components/admin/create-society-modal";
import { SocietiesManagement } from "@/components/admin/societies-management";
import { AdminManagementModal } from "@/components/admin/admin-management-modal";
import { SystemSettingsModal } from "@/components/admin/system-settings-modal";
import { BackupRestoreModal } from "@/components/admin/backup-restore-modal";
import type { GlobalStats, Society } from "@shared/schema";

export default function SuperAdminDashboard() {
  const [currentView, setCurrentView] = useState<'dashboard' | 'societies' | 'analytics' | 'plans'>('dashboard');
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

  const { data: stats, isLoading: statsLoading } = useQuery<GlobalStats>({
    queryKey: ["/api/dashboard/stats"],
    enabled: isAuthenticated && user?.role === 'super_admin',
    retry: false,
  });

  const { data: societies, isLoading: societiesLoading } = useQuery<Society[]>({
    queryKey: ["/api/societies"],
    enabled: isAuthenticated && user?.role === 'super_admin',
    retry: false,
  });

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const systemManagement = [
    { icon: PlusCircle, label: "Add Society", color: "from-primary to-accent" },
    { icon: ShieldQuestion, label: "Manage Admins", color: "from-secondary to-accent" },
    { icon: Settings, label: "System Settings", color: "from-primary to-secondary" },
    { icon: Database, label: "Backup & Restore", color: "from-accent to-primary" },
  ];

  if (currentView === 'societies') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <Navbar />
        <div className="pt-20 px-4 sm:px-6 lg:px-8 pb-8">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6">
              <Button 
                variant="outline" 
                onClick={() => setCurrentView('dashboard')}
                className="mb-4"
                data-testid="button-back-to-dashboard"
              >
                ← Back to Dashboard
              </Button>
            </div>
            <SocietiesManagement />
          </div>
        </div>
      </div>
    );
  }

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
              <h1 className="text-2xl md:text-3xl font-bold text-foreground" data-testid="text-super-admin-dashboard">Super Admin Dashboard</h1>
              <p className="text-muted-foreground mt-2">Manage all societies and system-wide operations</p>
            </div>
          </motion.div>
          
          {/* System Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
            {[
              { 
                title: "Total Societies", 
                value: stats?.totalSocieties || 0, 
                icon: Building, 
                color: "from-primary to-accent",
                testId: "text-total-societies"
              },
              { 
                title: "Active Users", 
                value: stats?.totalUsers || 0, 
                icon: Users, 
                color: "from-secondary to-accent",
                testId: "text-active-users"
              },
              { 
                title: "Monthly Revenue", 
                value: `₹${((stats?.totalRevenue || 0) / 100000).toFixed(1)}L`, 
                icon: TrendingUp, 
                color: "from-primary to-secondary",
                testId: "text-monthly-revenue"
              },
              { 
                title: "System Health", 
                value: `${stats?.systemHealth || 98}%`, 
                icon: Server, 
                color: "from-accent to-primary",
                testId: "text-system-health"
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
          
          {/* Management Tools & Recent Activities */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 mb-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>System Management</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <CreateSocietyModal 
                      trigger={
                        <Button
                          variant="ghost"
                          className="h-auto p-4 flex flex-col items-center justify-center hover:bg-primary hover:text-white transition-all group"
                          data-testid="button-add-society"
                        >
                          <PlusCircle className="h-6 w-6 mb-2 group-hover:scale-110 transition-transform" />
                          <span className="text-sm font-medium">Add Society</span>
                        </Button>
                      }
                    />
                    <AdminManagementModal 
                      trigger={
                        <Button
                          variant="ghost"
                          className="h-auto p-4 flex flex-col items-center justify-center hover:bg-primary hover:text-white transition-all group"
                          data-testid="button-manage-admins"
                        >
                          <ShieldQuestion className="h-6 w-6 mb-2 group-hover:scale-110 transition-transform" />
                          <span className="text-sm font-medium">Manage Admins</span>
                        </Button>
                      }
                    />
                    <SystemSettingsModal 
                      trigger={
                        <Button
                          variant="ghost"
                          className="h-auto p-4 flex flex-col items-center justify-center hover:bg-primary hover:text-white transition-all group"
                          data-testid="button-system-settings"
                        >
                          <Settings className="h-6 w-6 mb-2 group-hover:scale-110 transition-transform" />
                          <span className="text-sm font-medium">System Settings</span>
                        </Button>
                      }
                    />
                    <BackupRestoreModal 
                      trigger={
                        <Button
                          variant="ghost"
                          className="h-auto p-4 flex flex-col items-center justify-center hover:bg-primary hover:text-white transition-all group"
                          data-testid="button-backup-restore"
                        >
                          <Database className="h-6 w-6 mb-2 group-hover:scale-110 transition-transform" />
                          <span className="text-sm font-medium">Backup & Restore</span>
                        </Button>
                      }
                    />
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
                  <CardTitle>Recent Societies</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {societiesLoading ? (
                      <div className="text-center text-muted-foreground">Loading societies...</div>
                    ) : societies && societies.length > 0 ? (
                      societies.slice(0, 3).map((society: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                          <div>
                            <p className="font-medium text-foreground" data-testid={`text-society-name-${index}`}>
                              {society.name}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {society.totalFlats} flats • Created {new Date(society.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <Badge variant="secondary" data-testid={`badge-society-status-${index}`}>
                            Active
                          </Badge>
                        </div>
                      ))
                    ) : (
                      <div className="text-center text-muted-foreground" data-testid="text-no-societies">
                        No societies found
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
          
          {/* System Modules */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: "Society Management",
                description: "Create, update, and monitor all registered societies.",
                icon: Building,
                buttonText: "Manage Societies",
                color: "from-primary to-accent",
                testId: "button-manage-societies"
              },
              {
                title: "Global Analytics",
                description: "System-wide reports and performance analytics.",
                icon: TrendingUp,
                buttonText: "View Analytics",
                color: "from-secondary to-accent",
                testId: "button-view-analytics"
              },
              {
                title: "Subscription Plans",
                description: "Manage subscription plans and billing models.",
                icon: Server,
                buttonText: "Manage Plans",
                color: "from-accent to-primary",
                testId: "button-manage-plans"
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
                      onClick={() => {
                        console.log('Module button clicked:', module.buttonText);
                        if (module.buttonText === 'Manage Societies') {
                          setCurrentView('societies');
                        } else if (module.buttonText === 'View Analytics') {
                          setCurrentView('analytics');
                          toast({ title: "Feature Coming Soon", description: "Global analytics will be available soon." });
                        } else if (module.buttonText === 'Manage Plans') {
                          setCurrentView('plans');
                          toast({ title: "Feature Coming Soon", description: "Subscription plans management will be available soon." });
                        }
                      }}
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
