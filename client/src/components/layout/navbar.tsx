import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Building, Bell, Menu, X } from "lucide-react";

export default function Navbar() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const handleNotifications = () => {
    toast({
      title: "Notifications",
      description: "No new notifications at the moment.",
    });
  };

  const handleMobileMenu = () => {
    setShowMobileMenu(!showMobileMenu);
  };

  return (
    <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-border dark:bg-background/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <motion.div 
            className="flex items-center space-x-2 cursor-pointer"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            onClick={() => window.location.href = '/'}
          >
            <div className="w-8 h-8 bg-gradient-to-r from-primary to-accent rounded-lg flex items-center justify-center">
              <Building className="h-4 w-4 text-white" />
            </div>
            <span className="text-xl font-bold text-foreground" data-testid="text-logo">SocietyHub</span>
          </motion.div>
          
          {isAuthenticated ? (
            <motion.div 
              className="flex items-center space-x-4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <div className="relative">
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={handleNotifications}
                  className="rounded-lg hover:bg-muted"
                  data-testid="button-notifications"
                >
                  <Bell className="h-5 w-5" />
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-destructive rounded-full animate-pulse" />
                </Button>
              </div>
              
              <ThemeToggle className="rounded-lg hover:bg-muted" />
              
              <div className="hidden md:flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">Welcome,</span>
                <span className="text-sm font-medium text-foreground" data-testid="text-user-welcome">
                  {user?.firstName || "User"}
                </span>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={async () => {
                  try {
                    await fetch('/api/auth/logout', { method: 'POST' });
                    window.location.href = '/';
                  } catch (error) {
                    console.error('Logout failed:', error);
                  }
                }}
                className="text-muted-foreground hover:text-foreground transition-colors"
                data-testid="button-logout"
              >
                Logout
              </Button>
            </motion.div>
          ) : (
            <motion.div 
              className="hidden md:flex items-center space-x-8"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">Features</a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">About</a>
              <ThemeToggle className="rounded-lg hover:bg-muted" />
              <Button 
                className="bg-gradient-to-r from-primary to-accent text-white hover:opacity-90 transition-opacity"
                onClick={() => window.location.href = '/api/login'}
                data-testid="button-get-started"
              >
                Get Started
              </Button>
            </motion.div>
          )}

          {/* Mobile menu button and theme toggle */}
          <div className="flex items-center space-x-2 md:hidden">
            <ThemeToggle className="rounded-lg hover:bg-muted" />
            <Button
              variant="ghost"
              size="icon"
              onClick={handleMobileMenu}
              data-testid="button-mobile-menu"
            >
              {showMobileMenu ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
        
        {/* Mobile menu */}
        <AnimatePresence>
          {showMobileMenu && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden bg-background/95 backdrop-blur-md border-t border-border"
            >
            <div className="px-4 py-4 space-y-4">
              {isAuthenticated ? (
                <>
                  <div className="flex items-center space-x-3 pb-3 border-b border-border">
                    <span className="text-sm text-muted-foreground">Welcome,</span>
                    <span className="text-sm font-medium text-foreground" data-testid="text-user-welcome-mobile">
                      {user?.firstName || "User"}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    onClick={handleNotifications}
                    className="w-full justify-start"
                    data-testid="button-notifications-mobile"
                  >
                    <Bell className="h-4 w-4 mr-2" />
                    Notifications
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={async () => {
                      try {
                        await fetch('/api/auth/logout', { method: 'POST' });
                        window.location.href = '/';
                      } catch (error) {
                        console.error('Logout failed:', error);
                      }
                    }}
                    className="w-full justify-start text-muted-foreground hover:text-foreground"
                    data-testid="button-logout-mobile"
                  >
                    Logout
                  </Button>
                </>
              ) : (
                <>
                  <a href="#" className="block py-2 text-muted-foreground hover:text-primary transition-colors">Features</a>
                  <a href="#" className="block py-2 text-muted-foreground hover:text-primary transition-colors">About</a>
                  <Button 
                    className="w-full bg-gradient-to-r from-primary to-accent text-white hover:opacity-90 transition-opacity"
                    onClick={() => window.location.href = '/api/login'}
                    data-testid="button-get-started-mobile"
                  >
                    Get Started
                  </Button>
                </>
              )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
}
