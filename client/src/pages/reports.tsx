import { useState } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/layout/navbar";
import { TrendingUp, Users, IndianRupee, Calendar, Download, FileText, BarChart3, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";

export default function Reports() {
  const [, setLocation] = useLocation();
  const [selectedReport, setSelectedReport] = useState<string | null>(null);

  const reportTypes = [
    {
      id: "financial",
      title: "Financial Report",
      description: "Monthly revenue, expenses, and pending dues analysis",
      icon: IndianRupee,
      color: "from-primary to-accent",
      stats: { revenue: "₹2.5L", expenses: "₹1.2L", pending: "₹45K" }
    },
    {
      id: "occupancy",
      title: "Occupancy Report",
      description: "Flat occupancy status and vacancy rates",
      icon: Users,
      color: "from-secondary to-accent",
      stats: { occupied: "85%", vacant: "15%", total: "120 flats" }
    },
    {
      id: "maintenance",
      title: "Maintenance Report",
      description: "Complaints, resolutions, and pending maintenance",
      icon: FileText,
      color: "from-accent to-primary",
      stats: { resolved: "45", pending: "12", avgTime: "3 days" }
    },
    {
      id: "facility",
      title: "Facility Usage Report",
      description: "Booking statistics and facility utilization",
      icon: Calendar,
      color: "from-primary to-secondary",
      stats: { bookings: "87", revenue: "₹15K", popular: "Clubhouse" }
    },
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
                onClick={() => setLocation("/admin")}
                data-testid="button-back-to-dashboard"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-foreground" data-testid="text-reports-title">
                  Reports & Analytics
                </h1>
                <p className="text-muted-foreground mt-2">Generate and download detailed reports</p>
              </div>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {reportTypes.map((report, index) => (
              <motion.div
                key={report.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Card className="hover:shadow-lg transition-all duration-300">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <report.icon className="h-5 w-5 text-primary" />
                        {report.title}
                      </CardTitle>
                      <Badge variant="secondary" data-testid={`badge-${report.id}-type`}>
                        Monthly
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">{report.description}</p>
                    
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      {Object.entries(report.stats).map(([key, value]) => (
                        <div key={key} className="text-center">
                          <p className="text-xs text-muted-foreground capitalize">{key}</p>
                          <p className="text-lg font-semibold text-foreground" data-testid={`text-${report.id}-${key}`}>
                            {value}
                          </p>
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-2">
                      <Button
                        className={`flex-1 bg-gradient-to-r ${report.color} text-white`}
                        data-testid={`button-view-${report.id}`}
                        onClick={() => setSelectedReport(report.id)}
                      >
                        <BarChart3 className="h-4 w-4 mr-2" />
                        View Report
                      </Button>
                      <Button
                        variant="outline"
                        data-testid={`button-download-${report.id}`}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {selectedReport && (
            <motion.div
              className="mt-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Detailed {reportTypes.find(r => r.id === selectedReport)?.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <TrendingUp className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">
                      Detailed report visualization would appear here with charts and tables
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
