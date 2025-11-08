import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/layout/navbar";
import { TrendingUp, Building, Users, IndianRupee, Activity, ArrowLeft, Download } from "lucide-react";
import { useLocation } from "wouter";

export default function GlobalAnalytics() {
  const [, setLocation] = useLocation();
  const [selectedMetric, setSelectedMetric] = useState<"revenue" | "users" | "societies">("revenue");

  const analyticsData = {
    totalSocieties: 15,
    totalUsers: 1250,
    monthlyRevenue: "₹12.5L",
    activeUsers: "92%",
    growth: "+23%",
  };

  const societyPerformance = [
    { name: "Green Valley Apartments", users: 120, revenue: "₹2.5L", health: 95 },
    { name: "Sunshine Residency", users: 85, revenue: "₹1.8L", health: 88 },
    { name: "Royal Heights", users: 150, revenue: "₹3.2L", health: 92 },
    { name: "Paradise Towers", users: 95, revenue: "₹2.1L", health: 90 },
    { name: "Ocean View", users: 110, revenue: "₹2.3L", health: 87 },
  ];

  const systemMetrics = [
    { label: "API Response Time", value: "120ms", status: "good" },
    { label: "Database Health", value: "98%", status: "good" },
    { label: "Active Sessions", value: "456", status: "good" },
    { label: "Error Rate", value: "0.2%", status: "good" },
  ];

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
                onClick={() => setLocation("/super-admin")}
                data-testid="button-back-to-dashboard"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-foreground" data-testid="text-global-analytics-title">
                  Global Analytics
                </h1>
                <p className="text-muted-foreground mt-2">System-wide performance metrics and insights</p>
              </div>
            </div>
            <Button variant="outline" data-testid="button-export-analytics">
              <Download className="h-4 w-4 mr-2" />
              Export Data
            </Button>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            {[
              { title: "Total Societies", value: analyticsData.totalSocieties, icon: Building, color: "from-primary to-accent" },
              { title: "Total Users", value: analyticsData.totalUsers, icon: Users, color: "from-secondary to-accent" },
              { title: "Monthly Revenue", value: analyticsData.monthlyRevenue, icon: IndianRupee, color: "from-primary to-secondary" },
              { title: "Active Users", value: analyticsData.activeUsers, icon: Activity, color: "from-accent to-primary" },
              { title: "Growth Rate", value: analyticsData.growth, icon: TrendingUp, color: "from-green-400 to-green-600" },
            ].map((stat, index) => (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Card className="hover:shadow-lg transition-all duration-300">
                  <CardContent className="p-6">
                    <div className={`w-10 h-10 bg-gradient-to-r ${stat.color} rounded-lg flex items-center justify-center mb-3`}>
                      <stat.icon className="h-5 w-5 text-white" />
                    </div>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <p className="text-2xl font-bold text-foreground mt-1" data-testid={`text-${stat.title.toLowerCase().replace(/\s+/g, '-')}`}>
                      {stat.value}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Top Performing Societies</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {societyPerformance.map((society, index) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-muted rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium text-foreground" data-testid={`text-society-${index}`}>{society.name}</p>
                          <div className="flex gap-4 mt-1 text-sm text-muted-foreground">
                            <span>{society.users} users</span>
                            <span>{society.revenue} revenue</span>
                          </div>
                        </div>
                        <Badge variant="default" data-testid={`badge-health-${index}`}>
                          {society.health}% Health
                        </Badge>
                      </div>
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
                  <CardTitle>System Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {systemMetrics.map((metric, index) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-muted rounded-lg">
                        <span className="text-sm font-medium text-foreground">{metric.label}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-semibold text-foreground" data-testid={`text-metric-${index}`}>
                            {metric.value}
                          </span>
                          <Badge variant={metric.status === "good" ? "default" : "destructive"}>
                            {metric.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Revenue Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <TrendingUp className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">
                  Revenue trend chart would appear here with detailed visualization
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
