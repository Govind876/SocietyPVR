import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/layout/navbar";
import { Check, Star, Zap, Crown, ArrowLeft, Edit, Plus } from "lucide-react";
import { useLocation } from "wouter";

interface Plan {
  id: string;
  name: string;
  price: string;
  description: string;
  features: string[];
  recommended?: boolean;
  icon: any;
  color: string;
  subscribers: number;
}

export default function SubscriptionPlans() {
  const [, setLocation] = useLocation();

  const plans: Plan[] = [
    {
      id: "basic",
      name: "Basic",
      price: "₹999/month",
      description: "Perfect for small societies",
      icon: Star,
      color: "from-secondary to-accent",
      subscribers: 5,
      features: [
        "Up to 50 flats",
        "Basic complaint management",
        "Announcements",
        "Payment tracking",
        "Email support",
      ],
    },
    {
      id: "pro",
      name: "Professional",
      price: "₹2,499/month",
      description: "Most popular for medium societies",
      icon: Zap,
      color: "from-primary to-accent",
      recommended: true,
      subscribers: 8,
      features: [
        "Up to 200 flats",
        "Advanced complaint management",
        "Facility booking",
        "Digital voting",
        "Financial reports",
        "Priority support",
        "Mobile app access",
      ],
    },
    {
      id: "enterprise",
      name: "Enterprise",
      price: "₹4,999/month",
      description: "For large societies and townships",
      icon: Crown,
      color: "from-accent to-primary",
      subscribers: 2,
      features: [
        "Unlimited flats",
        "All Pro features",
        "Custom integrations",
        "Dedicated account manager",
        "24/7 phone support",
        "Custom branding",
        "Advanced analytics",
        "API access",
      ],
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
                onClick={() => setLocation("/super-admin")}
                data-testid="button-back-to-dashboard"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-foreground" data-testid="text-subscription-plans-title">
                  Subscription Plans
                </h1>
                <p className="text-muted-foreground mt-2">Manage pricing tiers and features</p>
              </div>
            </div>
            <Button variant="default" data-testid="button-create-plan">
              <Plus className="h-4 w-4 mr-2" />
              Create New Plan
            </Button>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {plans.map((plan, index) => (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Card className={`relative hover:shadow-xl transition-all duration-300 ${plan.recommended ? 'ring-2 ring-primary' : ''}`}>
                  {plan.recommended && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <Badge variant="default" className="bg-primary" data-testid="badge-recommended">
                        Recommended
                      </Badge>
                    </div>
                  )}
                  
                  <CardHeader className="text-center pb-6">
                    <div className={`w-16 h-16 mx-auto bg-gradient-to-r ${plan.color} rounded-lg flex items-center justify-center mb-4`}>
                      <plan.icon className="h-8 w-8 text-white" />
                    </div>
                    <CardTitle className="text-2xl" data-testid={`text-plan-${plan.id}-name`}>{plan.name}</CardTitle>
                    <p className="text-muted-foreground text-sm mt-2">{plan.description}</p>
                    <div className="mt-4">
                      <span className="text-3xl font-bold text-foreground" data-testid={`text-plan-${plan.id}-price`}>
                        {plan.price.split('/')[0]}
                      </span>
                      <span className="text-muted-foreground">/{plan.price.split('/')[1]}</span>
                    </div>
                    <Badge variant="secondary" className="mt-2" data-testid={`badge-subscribers-${plan.id}`}>
                      {plan.subscribers} societies subscribed
                    </Badge>
                  </CardHeader>

                  <CardContent>
                    <ul className="space-y-3 mb-6">
                      {plan.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-start gap-2">
                          <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-foreground">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <div className="flex gap-2">
                      <Button 
                        className="flex-1" 
                        variant={plan.recommended ? "default" : "outline"}
                        data-testid={`button-edit-${plan.id}`}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Plan
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Plan Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  Detailed feature comparison table would appear here
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
