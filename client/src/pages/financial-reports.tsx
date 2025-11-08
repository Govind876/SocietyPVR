import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/layout/navbar";
import { TrendingUp, TrendingDown, IndianRupee, Users, Calendar, Download, ArrowLeft, FileText } from "lucide-react";
import { useLocation } from "wouter";

export default function FinancialReports() {
  const [, setLocation] = useLocation();
  const [selectedPeriod, setSelectedPeriod] = useState<"month" | "quarter" | "year">("month");

  const financialData = {
    month: {
      revenue: "₹2,45,000",
      expenses: "₹1,23,000",
      pendingDues: "₹45,000",
      collections: "₹2,00,000",
      growth: "+12%",
    },
    quarter: {
      revenue: "₹7,35,000",
      expenses: "₹3,69,000",
      pendingDues: "₹45,000",
      collections: "₹6,90,000",
      growth: "+15%",
    },
    year: {
      revenue: "₹29,40,000",
      expenses: "₹14,76,000",
      pendingDues: "₹45,000",
      collections: "₹27,60,000",
      growth: "+18%",
    },
  };

  const currentData = financialData[selectedPeriod];

  const expenseCategories = [
    { category: "Maintenance Staff", amount: "₹45,000", percentage: "37%" },
    { category: "Utilities", amount: "₹28,000", percentage: "23%" },
    { category: "Security", amount: "₹25,000", percentage: "20%" },
    { category: "Cleaning", amount: "₹15,000", percentage: "12%" },
    { category: "Others", amount: "₹10,000", percentage: "8%" },
  ];

  const recentTransactions = [
    { id: 1, type: "credit", description: "Maintenance Collection - A-101", amount: "₹2,500", date: "2024-11-08" },
    { id: 2, type: "debit", description: "Electricity Bill Payment", amount: "₹15,000", date: "2024-11-07" },
    { id: 3, type: "credit", description: "Facility Booking - Clubhouse", amount: "₹1,500", date: "2024-11-07" },
    { id: 4, type: "debit", description: "Security Staff Salary", amount: "₹25,000", date: "2024-11-06" },
    { id: 5, type: "credit", description: "Maintenance Collection - B-203", amount: "₹2,500", date: "2024-11-06" },
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
                <h1 className="text-2xl md:text-3xl font-bold text-foreground" data-testid="text-financial-reports-title">
                  Financial Reports
                </h1>
                <p className="text-muted-foreground mt-2">Detailed financial analysis and reports</p>
              </div>
            </div>
            <Button variant="outline" data-testid="button-download-report">
              <Download className="h-4 w-4 mr-2" />
              Download Report
            </Button>
          </motion.div>

          <div className="flex gap-2 mb-6">
            {(["month", "quarter", "year"] as const).map((period) => (
              <Button
                key={period}
                variant={selectedPeriod === period ? "default" : "outline"}
                onClick={() => setSelectedPeriod(period)}
                data-testid={`button-period-${period}`}
              >
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </Button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[
              { title: "Total Revenue", value: currentData.revenue, icon: IndianRupee, color: "from-primary to-accent", trend: "up" },
              { title: "Total Expenses", value: currentData.expenses, icon: TrendingDown, color: "from-secondary to-accent", trend: "down" },
              { title: "Pending Dues", value: currentData.pendingDues, icon: FileText, color: "from-accent to-primary", trend: "down" },
              { title: "Collections", value: currentData.collections, icon: TrendingUp, color: "from-primary to-secondary", trend: "up" },
            ].map((stat, index) => (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Card className="hover:shadow-lg transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">{stat.title}</p>
                        <p className="text-2xl font-bold text-foreground mt-1" data-testid={`text-${stat.title.toLowerCase().replace(/\s+/g, '-')}`}>
                          {stat.value}
                        </p>
                        <Badge variant={stat.trend === "up" ? "default" : "secondary"} className="mt-2">
                          {currentData.growth}
                        </Badge>
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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Expense Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {expenseCategories.map((category, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-foreground">{category.category}</span>
                            <span className="text-sm text-muted-foreground">{category.percentage}</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div 
                              className="bg-primary h-2 rounded-full transition-all duration-500" 
                              style={{ width: category.percentage }}
                            />
                          </div>
                        </div>
                        <span className="ml-4 text-sm font-semibold text-foreground" data-testid={`text-expense-${category.category.toLowerCase().replace(/\s+/g, '-')}`}>
                          {category.amount}
                        </span>
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
                  <CardTitle>Recent Transactions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {recentTransactions.map((transaction) => (
                      <div 
                        key={transaction.id} 
                        className="flex items-center justify-between p-3 bg-muted rounded-lg"
                        data-testid={`transaction-${transaction.id}`}
                      >
                        <div className="flex-1">
                          <p className="text-sm font-medium text-foreground">{transaction.description}</p>
                          <p className="text-xs text-muted-foreground">{transaction.date}</p>
                        </div>
                        <span className={`text-sm font-semibold ${transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                          {transaction.type === 'credit' ? '+' : '-'} {transaction.amount}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
