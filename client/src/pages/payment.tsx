import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import Navbar from "@/components/layout/navbar";
import { CreditCard, Building, IndianRupee, CheckCircle, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

export default function Payment() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [paymentMethod, setPaymentMethod] = useState<"card" | "upi" | "netbanking">("card");
  const [processing, setProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const pendingDues = [
    { type: "Maintenance Fee", amount: "₹2,500", dueDate: "2024-11-15", status: "pending" },
    { type: "Water Charges", amount: "₹450", dueDate: "2024-11-15", status: "pending" },
    { type: "Parking Fee", amount: "₹500", dueDate: "2024-11-10", status: "overdue" },
  ];

  const totalAmount = "₹3,450";

  const handlePayment = () => {
    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      setPaymentSuccess(true);
      toast({
        title: "Payment Successful",
        description: `Successfully paid ${totalAmount}`,
      });
    }, 2000);
  };

  if (paymentSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <Navbar />
        <div className="pt-20 px-4 sm:px-6 lg:px-8 pb-8">
          <div className="max-w-2xl mx-auto">
            <Card className="text-center">
              <CardContent className="pt-12 pb-12">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="h-12 w-12 text-green-600" />
                  </div>
                </motion.div>
                <h2 className="text-2xl font-bold text-foreground mb-2" data-testid="text-payment-success">
                  Payment Successful!
                </h2>
                <p className="text-muted-foreground mb-6">
                  Your payment of {totalAmount} has been processed successfully.
                </p>
                <div className="flex gap-4 justify-center">
                  <Button onClick={() => setLocation("/resident")} data-testid="button-back-to-dashboard">
                    Back to Dashboard
                  </Button>
                  <Button variant="outline" data-testid="button-download-receipt">
                    Download Receipt
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Navbar />
      
      <div className="pt-20 px-4 sm:px-6 lg:px-8 pb-8">
        <div className="max-w-4xl mx-auto">
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
                data-testid="button-back"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-foreground" data-testid="text-payment-title">
                  Pay Dues
                </h1>
                <p className="text-muted-foreground mt-2">Complete your pending payments</p>
              </div>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                className="space-y-6"
              >
                <Card>
                  <CardHeader>
                    <CardTitle>Pending Dues</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {pendingDues.map((due, index) => (
                        <div 
                          key={index} 
                          className="flex items-center justify-between p-4 bg-muted rounded-lg"
                          data-testid={`due-item-${index}`}
                        >
                          <div>
                            <p className="font-medium text-foreground">{due.type}</p>
                            <p className="text-sm text-muted-foreground">Due: {due.dueDate}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-semibold text-foreground">{due.amount}</p>
                            <Badge variant={due.status === "overdue" ? "destructive" : "secondary"}>
                              {due.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Payment Method</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <RadioGroup value={paymentMethod} onValueChange={(value: any) => setPaymentMethod(value)}>
                      <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-muted cursor-pointer">
                        <RadioGroupItem value="card" id="card" data-testid="radio-card" />
                        <Label htmlFor="card" className="flex-1 cursor-pointer">
                          <div className="flex items-center gap-2">
                            <CreditCard className="h-5 w-5 text-primary" />
                            <span className="font-medium">Credit/Debit Card</span>
                          </div>
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-muted cursor-pointer">
                        <RadioGroupItem value="upi" id="upi" data-testid="radio-upi" />
                        <Label htmlFor="upi" className="flex-1 cursor-pointer">
                          <div className="flex items-center gap-2">
                            <IndianRupee className="h-5 w-5 text-primary" />
                            <span className="font-medium">UPI</span>
                          </div>
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-muted cursor-pointer">
                        <RadioGroupItem value="netbanking" id="netbanking" data-testid="radio-netbanking" />
                        <Label htmlFor="netbanking" className="flex-1 cursor-pointer">
                          <div className="flex items-center gap-2">
                            <Building className="h-5 w-5 text-primary" />
                            <span className="font-medium">Net Banking</span>
                          </div>
                        </Label>
                      </div>
                    </RadioGroup>

                    {paymentMethod === "card" && (
                      <div className="mt-6 space-y-4">
                        <div>
                          <Label htmlFor="cardNumber">Card Number</Label>
                          <Input id="cardNumber" placeholder="1234 5678 9012 3456" data-testid="input-card-number" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="expiry">Expiry Date</Label>
                            <Input id="expiry" placeholder="MM/YY" data-testid="input-expiry" />
                          </div>
                          <div>
                            <Label htmlFor="cvv">CVV</Label>
                            <Input id="cvv" placeholder="123" type="password" data-testid="input-cvv" />
                          </div>
                        </div>
                      </div>
                    )}

                    {paymentMethod === "upi" && (
                      <div className="mt-6">
                        <Label htmlFor="upiId">UPI ID</Label>
                        <Input id="upiId" placeholder="yourname@upi" data-testid="input-upi-id" />
                      </div>
                    )}

                    {paymentMethod === "netbanking" && (
                      <div className="mt-6">
                        <Label htmlFor="bank">Select Bank</Label>
                        <Input id="bank" placeholder="Select your bank" data-testid="input-bank" />
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            <div className="lg:col-span-1">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <Card className="sticky top-24">
                  <CardHeader>
                    <CardTitle>Payment Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {pendingDues.map((due, index) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span className="text-muted-foreground">{due.type}</span>
                          <span className="text-foreground font-medium">{due.amount}</span>
                        </div>
                      ))}
                      <div className="border-t pt-3 mt-3">
                        <div className="flex justify-between text-lg font-bold">
                          <span className="text-foreground">Total Amount</span>
                          <span className="text-foreground" data-testid="text-total-amount">{totalAmount}</span>
                        </div>
                      </div>
                    </div>
                    <Button 
                      className="w-full mt-6 bg-gradient-to-r from-primary to-accent"
                      onClick={handlePayment}
                      disabled={processing}
                      data-testid="button-pay-now"
                    >
                      {processing ? "Processing..." : `Pay ${totalAmount}`}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
