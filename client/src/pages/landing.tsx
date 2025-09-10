import { useState } from "react";
import { motion, useScroll, useTransform, useMotionValue } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import Navbar from "@/components/layout/navbar";
import LoginForm from "@/components/auth/login-form";
import SignupForm from "@/components/auth/signup-form";
import { useAuth } from "@/hooks/useAuth";
import { Building, Users, Calendar, Bell, ChartBar, Smartphone } from "lucide-react";
import { useLocation } from "wouter";
// Using public image path instead of import

export default function Landing() {
  const { scrollY } = useScroll();
  const yBg = useTransform(scrollY, [0, 500], [0, -100]);
  const yFloat = useTransform(scrollY, [0, 500], [0, 50]);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  
  const features = [
    {
      icon: Users,
      title: "Resident Management",
      description: "Comprehensive resident database with flat assignments and occupancy tracking.",
      delay: 0.1,
    },
    {
      icon: Building,
      title: "Maintenance Requests",
      description: "Streamlined complaint management with status tracking and vendor assignment.",
      delay: 0.2,
    },
    {
      icon: Calendar,
      title: "Facility Booking",
      description: "Easy booking system for amenities with calendar integration and approval workflow.",
      delay: 0.3,
    },
    {
      icon: Bell,
      title: "Real-time Notifications",
      description: "Instant announcements and alerts via email, SMS, and app notifications.",
      delay: 0.4,
    },
    {
      icon: ChartBar,
      title: "Analytics & Reports",
      description: "Comprehensive reporting with financial insights and usage analytics.",
      delay: 0.5,
    },
    {
      icon: Smartphone,
      title: "Mobile Ready",
      description: "Responsive design that works perfectly on all devices and screen sizes.",
      delay: 0.6,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative pt-20 pb-32 overflow-hidden">
        <motion.div 
          style={{ y: yBg }}
          className="absolute inset-0 bg-gradient-to-br from-primary/10 via-secondary/5 to-accent/10"
        />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight mb-6">
                Modern Society{" "}
                <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  Management
                </span>{" "}
                Made Simple
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground mb-8 leading-relaxed">
                Streamline your residential society operations with our comprehensive management platform. 
                From maintenance to community engagement, we've got you covered.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  size="lg" 
                  className="bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-all transform hover:scale-105"
                  onClick={() => setShowAuthModal(true)}
                  data-testid="button-start-trial"
                >
                  Start Free Trial
                </Button>
                <Button 
                  variant="outline" 
                  size="lg"
                  onClick={() => {
                    document.querySelector('#features')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="border-2 hover:bg-primary hover:text-white transition-all"
                  data-testid="button-learn-more"
                >
                  Learn More
                </Button>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative"
            >
              <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                <img 
                  src="/images/society-image.png" 
                  alt="Modern residential society complex with amenities" 
                  className="w-full h-auto hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    console.error("Image failed to load");
                    e.currentTarget.style.display = 'none';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent"></div>
              </div>
            </motion.div>
          </div>
        </div>
        
        {/* Enhanced Floating Elements */}
        <motion.div
          className="absolute top-1/4 left-10 w-16 h-16 bg-gradient-to-r from-primary to-accent rounded-full opacity-20"
          style={{ y: yFloat }}
          animate={{ 
            y: [0, -10, 0],
            rotate: [0, 180, 360],
            scale: [1, 1.1, 1]
          }}
          transition={{ 
            duration: 4, 
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute bottom-1/4 right-10 w-12 h-12 bg-gradient-to-r from-secondary to-accent rounded-full opacity-20"
          style={{ y: yFloat }}
          animate={{ 
            y: [0, -15, 0],
            x: [0, 5, 0],
            scale: [1, 1.2, 1]
          }}
          transition={{ 
            duration: 3, 
            repeat: Infinity, 
            delay: 1,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute top-1/2 right-1/4 w-8 h-8 bg-gradient-to-r from-accent to-secondary rounded-full opacity-15"
          animate={{ 
            y: [0, -20, 0],
            opacity: [0.15, 0.3, 0.15]
          }}
          transition={{ 
            duration: 5, 
            repeat: Infinity, 
            delay: 2,
            ease: "easeInOut"
          }}
        />
      </section>

      {/* Features Grid */}
      <section id="features" className="py-12 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-4">Everything You Need</h2>
            <p className="text-lg md:text-xl text-muted-foreground">Powerful features designed for modern society management</p>
          </motion.div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: feature.delay }}
                viewport={{ once: true }}
                whileHover={{ y: -5 }}
              >
                <Card className="h-full hover:shadow-lg transition-all duration-300">
                  <CardContent className="p-8">
                    <div className="w-12 h-12 bg-gradient-to-r from-primary to-accent rounded-xl flex items-center justify-center mb-6">
                      <feature.icon className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-foreground mb-4">{feature.title}</h3>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gradient-to-r from-primary/5 to-accent/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { number: "500+", label: "Societies", delay: 0 },
              { number: "10K+", label: "Happy Residents", delay: 0.1 },
              { number: "25K+", label: "Requests Handled", delay: 0.2 },
              { number: "99.9%", label: "Uptime", delay: 0.3 },
            ].map((stat, index) => (
              <motion.div
                key={index}
                className="text-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: stat.delay }}
                viewport={{ once: true }}
              >
                <div className="text-3xl lg:text-4xl font-bold text-primary mb-2">
                  {stat.number}
                </div>
                <div className="text-muted-foreground font-medium">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <motion.div
            className="bg-gradient-to-r from-primary to-accent rounded-3xl p-12"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold text-white mb-6">Ready to Transform Your Society?</h2>
            <p className="text-xl text-blue-100 mb-8">
              Join thousands of societies already using SocietyHub for better management.
            </p>
            <Button 
              size="lg"
              variant="secondary"
              className="bg-white text-primary hover:bg-gray-50 transition-all transform hover:scale-105"
              onClick={() => setShowAuthModal(true)}
              data-testid="button-get-started"
            >
              Get Started Today
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Authentication Modal */}
      <Dialog open={showAuthModal} onOpenChange={setShowAuthModal}>
        <DialogContent className="sm:max-w-md border-0 p-0">
          {authMode === "login" ? (
            <LoginForm
              onSuccess={() => {
                setShowAuthModal(false);
                // Refresh the page to redirect to dashboard
                window.location.reload();
              }}
              onSwitchToSignup={() => setAuthMode("signup")}
            />
          ) : (
            <SignupForm
              onSuccess={() => {
                setShowAuthModal(false);
                // Refresh the page to redirect to dashboard
                window.location.reload();
              }}
              onSwitchToLogin={() => setAuthMode("login")}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
