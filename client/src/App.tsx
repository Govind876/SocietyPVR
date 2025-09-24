import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { useAuth } from "@/hooks/useAuth";
import Landing from "@/pages/landing";
import AdminDashboard from "@/pages/admin-dashboard";
import ResidentDashboard from "@/pages/resident-dashboard";
import SuperAdminDashboard from "@/pages/super-admin-dashboard";
import Voting from "@/pages/voting";
import Marketplace from "@/pages/marketplace";
import ManageResidents from "@/pages/manage-residents";
import type { User } from "@shared/schema";

function Router() {
  const { user, isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Switch>
      {!isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <>
          <Route path="/" component={() => {
            if (user?.role === 'super_admin') return <SuperAdminDashboard />;
            if (user?.role === 'admin') return <AdminDashboard />;
            if (user?.role === 'resident') return <ResidentDashboard />;
            return <Landing />; // Fallback if role is not recognized
          }} />
          <Route path="/admin" component={AdminDashboard} />
          <Route path="/resident" component={ResidentDashboard} />
          <Route path="/super-admin" component={SuperAdminDashboard} />
          <Route path="/voting" component={Voting} />
          <Route path="/marketplace" component={Marketplace} />
          <Route path="/manage-residents" component={ManageResidents} />
        </>
      )}
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
