import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import Landing from "@/pages/landing";
import AdminDashboard from "@/pages/admin-dashboard";
import ResidentDashboard from "@/pages/resident-dashboard";
import SuperAdminDashboard from "@/pages/super-admin-dashboard";
import Voting from "@/pages/voting";
import NotFound from "@/pages/not-found";
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
          {user?.role === 'super_admin' && (
            <Route path="/" component={SuperAdminDashboard} />
          )}
          {user?.role === 'admin' && (
            <Route path="/" component={AdminDashboard} />
          )}
          {user?.role === 'resident' && (
            <Route path="/" component={ResidentDashboard} />
          )}
          <Route path="/admin" component={AdminDashboard} />
          <Route path="/resident" component={ResidentDashboard} />
          <Route path="/super-admin" component={SuperAdminDashboard} />
          <Route path="/voting" component={Voting} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
