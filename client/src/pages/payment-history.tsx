import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/layout/navbar";
import { Calendar, Download, Receipt, ArrowLeft, Filter } from "lucide-react";
import { useLocation } from "wouter";

interface Payment {
  id: number;
  description: string;
  amount: string;
  date: string;
  status: "success" | "pending" | "failed";
  method: string;
  receiptId: string;
}

export default function PaymentHistory() {
  const [, setLocation] = useLocation();
  const [selectedPeriod, setSelectedPeriod] = useState<"all" | "month" | "quarter" | "year">("all");

  const payments: Payment[] = [
    { id: 1, description: "Maintenance Fee - November", amount: "₹2,500", date: "2024-11-01", status: "success", method: "UPI", receiptId: "REC001" },
    { id: 2, description: "Water Charges - November", amount: "₹450", date: "2024-11-01", status: "success", method: "Card", receiptId: "REC002" },
    { id: 3, description: "Clubhouse Booking", amount: "₹1,500", date: "2024-10-25", status: "success", method: "Net Banking", receiptId: "REC003" },
    { id: 4, description: "Parking Fee - October", amount: "₹500", date: "2024-10-15", status: "success", method: "UPI", receiptId: "REC004" },
    { id: 5, description: "Maintenance Fee - October", amount: "₹2,500", date: "2024-10-01", status: "success", method: "Card", receiptId: "REC005" },
    { id: 6, description: "Swimming Pool Booking", amount: "₹500", date: "2024-09-20", status: "success", method: "UPI", receiptId: "REC006" },
  ];

  const totalPaid = payments.reduce((sum, p) => {
    const amount = parseInt(p.amount.replace(/[₹,]/g, ''));
    return sum + amount;
  }, 0);

  const stats = {
    total: `₹${(totalPaid / 1000).toFixed(1)}K`,
    count: payments.length,
    avgPayment: `₹${Math.round(totalPaid / payments.length)}`,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Navbar />
      
      <div className="pt-20 px-4 sm:px-6 lg:px-8 pb-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="flex flex-wrap items-center justify-between gap-4 mb-8"
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
                <h1 className="text-2xl md:text-3xl font-bold text-foreground" data-testid="text-payment-history-title">
                  Payment History
                </h1>
                <p className="text-muted-foreground mt-2">View all your payment transactions</p>
              </div>
            </div>
            <Button variant="outline" data-testid="button-download-history">
              <Download className="h-4 w-4 mr-2" />
              Download All
            </Button>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            {[
              { label: "Total Paid", value: stats.total },
              { label: "Transactions", value: stats.count },
              { label: "Avg Payment", value: stats.avgPayment },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Card>
                  <CardContent className="p-6">
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl font-bold text-foreground mt-1" data-testid={`text-${stat.label.toLowerCase().replace(/\s+/g, '-')}`}>
                      {stat.value}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Transaction History</CardTitle>
                <div className="flex gap-2">
                  {(["all", "month", "quarter", "year"] as const).map((period) => (
                    <Button
                      key={period}
                      variant={selectedPeriod === period ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedPeriod(period)}
                      data-testid={`button-filter-${period}`}
                    >
                      {period.charAt(0).toUpperCase() + period.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {payments.map((payment, index) => (
                  <motion.div
                    key={payment.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.05 }}
                    className="flex flex-wrap items-center justify-between p-4 bg-muted rounded-lg gap-4"
                    data-testid={`payment-${payment.id}`}
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-[200px]">
                      <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                        <Receipt className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground" data-testid={`text-payment-desc-${payment.id}`}>
                          {payment.description}
                        </p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span>{payment.date}</span>
                          <span>•</span>
                          <span>{payment.method}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-lg font-semibold text-foreground" data-testid={`text-payment-amount-${payment.id}`}>
                          {payment.amount}
                        </p>
                        <p className="text-xs text-muted-foreground">{payment.receiptId}</p>
                      </div>

                      <Badge 
                        variant={payment.status === "success" ? "default" : payment.status === "pending" ? "secondary" : "destructive"}
                        data-testid={`badge-payment-status-${payment.id}`}
                      >
                        {payment.status}
                      </Badge>

                      <Button
                        variant="outline"
                        size="sm"
                        data-testid={`button-download-receipt-${payment.id}`}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
