import { useState } from "react";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import Navbar from "@/components/layout/navbar";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { ShieldPlus, ShieldQuestion, UserPlus, Trash2, ArrowLeft, Building, AlertCircle, CheckCircle } from "lucide-react";
import type { User, Society } from "@shared/schema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const createAdminSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
});

type CreateAdminFormData = z.infer<typeof createAdminSchema>;

export default function AdminManagement() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<string>("");
  const [selectedSociety, setSelectedSociety] = useState<string>("");
  const [adminToAssign, setAdminToAssign] = useState<User | null>(null);

  const form = useForm<CreateAdminFormData>({
    resolver: zodResolver(createAdminSchema),
    defaultValues: {
      email: "",
      password: "",
      firstName: "",
      lastName: "",
    },
  });

  const { data: admins = [], isLoading: adminsLoading } = useQuery<User[]>({
    queryKey: ["/api/admins"],
    enabled: isAuthenticated && user?.role === 'super_admin',
  });

  const { data: societies = [], isLoading: societiesLoading } = useQuery<Society[]>({
    queryKey: ["/api/societies"],
    enabled: isAuthenticated && user?.role === 'super_admin',
  });

  const { data: unassignedAdmins = [] } = useQuery<User[]>({
    queryKey: ["/api/admins/unassigned"],
    enabled: isAuthenticated && user?.role === 'super_admin',
  });

  const createAdminMutation = useMutation({
    mutationFn: async (data: CreateAdminFormData) => {
      return await apiRequest("/api/admins", "POST", data);
    },
    onSuccess: () => {
      toast({
        title: "Admin Created",
        description: "New admin user has been successfully created",
      });
      form.reset();
      setShowCreateModal(false);
      queryClient.invalidateQueries({ queryKey: ["/api/admins"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admins/unassigned"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const assignAdminMutation = useMutation({
    mutationFn: async ({ societyId, adminId }: { societyId: string; adminId: string }) => {
      return await apiRequest(`/api/societies/${societyId}/assign-admin`, "POST", { adminId });
    },
    onSuccess: (data: any) => {
      const isReassignment = data?.isReassignment || false;
      toast({
        title: isReassignment ? "Admin Reassigned" : "Admin Assigned",
        description: isReassignment 
          ? "Admin has been successfully reassigned to the society" 
          : "Admin has been successfully assigned to the society",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admins"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admins/unassigned"] });
      queryClient.invalidateQueries({ queryKey: ["/api/societies"] });
      setSelectedAdmin("");
      setSelectedSociety("");
      setAdminToAssign(null);
      setShowAssignModal(false);
    },
    onError: (error) => {
      toast({
        title: "Assignment Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const removeAdminMutation = useMutation({
    mutationFn: async (societyId: string) => {
      return await apiRequest(`/api/societies/${societyId}/admin`, "DELETE");
    },
    onSuccess: () => {
      toast({
        title: "Admin Removed",
        description: "Admin has been successfully removed from the society",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admins"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admins/unassigned"] });
      queryClient.invalidateQueries({ queryKey: ["/api/societies"] });
    },
    onError: (error) => {
      toast({
        title: "Removal Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteAdminMutation = useMutation({
    mutationFn: async (adminId: string) => {
      return await apiRequest(`/api/admins/${adminId}`, "DELETE");
    },
    onSuccess: () => {
      toast({
        title: "Admin Deleted",
        description: "Admin user has been permanently deleted",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admins"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admins/unassigned"] });
    },
    onError: (error) => {
      toast({
        title: "Deletion Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCreateAdmin = (data: CreateAdminFormData) => {
    createAdminMutation.mutate(data);
  };

  const handleAssignAdmin = () => {
    if (!selectedAdmin || !selectedSociety) {
      toast({
        title: "Selection Required",
        description: "Please select both an admin and a society",
        variant: "destructive",
      });
      return;
    }
    assignAdminMutation.mutate({ societyId: selectedSociety, adminId: selectedAdmin });
  };

  const handleOpenAssignModalForAdmin = (admin: User) => {
    setAdminToAssign(admin);
    setSelectedAdmin(admin.id);
    setSelectedSociety(admin.societyId || "");
    setShowAssignModal(true);
  };

  const handleRemoveAdmin = (admin: User) => {
    if (admin.societyId && window.confirm(`Remove ${admin.firstName} ${admin.lastName} from their assigned society?`)) {
      removeAdminMutation.mutate(admin.societyId);
    }
  };

  const handleDeleteAdmin = (admin: User) => {
    if (window.confirm(`Permanently delete admin ${admin.firstName} ${admin.lastName}? This action cannot be undone.`)) {
      deleteAdminMutation.mutate(admin.id);
    }
  };

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const selectedSocietyData = societies.find(s => s.id === selectedSociety);
  const currentAdminForSelectedSociety = selectedSocietyData?.adminId 
    ? admins.find(a => a.id === selectedSocietyData.adminId) 
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Navbar />
      
      <div className="pt-20 px-4 sm:px-6 lg:px-8 pb-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <motion.div
            className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => setLocation("/super-admin")}
                className="flex items-center gap-2"
                data-testid="button-back"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2" data-testid="text-admin-management-title">
                  <ShieldQuestion className="h-8 w-8 text-primary" />
                  Admin Management
                </h1>
                <p className="text-muted-foreground mt-2">Create, assign, and manage admin users for your societies</p>
              </div>
            </div>
            
            <div className="flex gap-3 mt-4 lg:mt-0">
              <Button
                onClick={() => setShowAssignModal(true)}
                className="bg-gradient-to-r from-secondary to-accent text-white"
                data-testid="button-assign-admin-to-society"
              >
                <Building className="h-4 w-4 mr-2" />
                Assign to Society
              </Button>
              <Button
                onClick={() => setShowCreateModal(true)}
                className="bg-gradient-to-r from-primary to-accent text-white"
                data-testid="button-create-admin"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Create Admin
              </Button>
            </div>
          </motion.div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Admins</p>
                    <p className="text-3xl font-bold text-foreground" data-testid="text-total-admins">
                      {adminsLoading ? "..." : admins.length}
                    </p>
                  </div>
                  <ShieldPlus className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Assigned</p>
                    <p className="text-3xl font-bold text-foreground" data-testid="text-assigned-admins">
                      {adminsLoading ? "..." : admins.filter(a => a.societyId).length}
                    </p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Unassigned</p>
                    <p className="text-3xl font-bold text-foreground" data-testid="text-unassigned-admins">
                      {adminsLoading ? "..." : unassignedAdmins.length}
                    </p>
                  </div>
                  <AlertCircle className="h-8 w-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Admins List */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>All Admin Users</CardTitle>
              </CardHeader>
              <CardContent>
                {adminsLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="text-muted-foreground mt-2">Loading admins...</p>
                  </div>
                ) : admins.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Assigned Society</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {admins.map((admin) => {
                          const assignedSociety = societies.find(s => s.id === admin.societyId);
                          return (
                            <TableRow key={admin.id} data-testid={`admin-row-${admin.id}`}>
                              <TableCell className="font-medium">
                                {admin.firstName} {admin.lastName}
                              </TableCell>
                              <TableCell data-testid={`admin-email-${admin.id}`}>
                                {admin.email}
                              </TableCell>
                              <TableCell>
                                {admin.societyId ? (
                                  <Badge variant="secondary" className="bg-green-100 text-green-800">Assigned</Badge>
                                ) : (
                                  <Badge variant="outline">Unassigned</Badge>
                                )}
                              </TableCell>
                              <TableCell data-testid={`admin-society-${admin.id}`}>
                                {assignedSociety ? assignedSociety.name : "-"}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleOpenAssignModalForAdmin(admin)}
                                    className="text-primary hover:text-primary"
                                    data-testid={`button-assign-society-${admin.id}`}
                                  >
                                    <Building className="h-3 w-3 mr-1" />
                                    {admin.societyId ? "Change Society" : "Assign Society"}
                                  </Button>
                                  {admin.societyId && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleRemoveAdmin(admin)}
                                      disabled={removeAdminMutation.isPending}
                                      data-testid={`button-remove-assignment-${admin.id}`}
                                    >
                                      Remove Assignment
                                    </Button>
                                  )}
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDeleteAdmin(admin)}
                                    disabled={deleteAdminMutation.isPending}
                                    className="text-red-600 hover:text-red-700"
                                    data-testid={`button-delete-admin-${admin.id}`}
                                  >
                                    <Trash2 className="h-3 w-3 mr-1" />
                                    Delete
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <ShieldQuestion className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-600 mb-2">No admins found</h3>
                    <p className="text-gray-500 mb-4">Create your first admin user to get started</p>
                    <Button
                      onClick={() => setShowCreateModal(true)}
                      className="bg-gradient-to-r from-primary to-accent text-white"
                      data-testid="button-create-first-admin"
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Create First Admin
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Create Admin Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent data-testid="modal-create-admin">
          <DialogHeader>
            <DialogTitle>Create New Admin</DialogTitle>
            <DialogDescription>
              Create a new admin user who can be assigned to manage a society
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleCreateAdmin)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="John"
                          {...field}
                          data-testid="input-admin-first-name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Doe"
                          {...field}
                          data-testid="input-admin-last-name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address *</FormLabel>
                    <FormControl>
                      <Input 
                        type="email"
                        placeholder="admin@example.com"
                        {...field}
                        data-testid="input-admin-email"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password *</FormLabel>
                    <FormControl>
                      <Input 
                        type="password"
                        placeholder="Minimum 6 characters"
                        {...field}
                        data-testid="input-admin-password"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1"
                  data-testid="button-cancel-create"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createAdminMutation.isPending}
                  className="flex-1 bg-gradient-to-r from-primary to-accent text-white"
                  data-testid="button-submit-create-admin"
                >
                  {createAdminMutation.isPending ? "Creating..." : "Create Admin"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Assign/Reassign Admin Modal */}
      <Dialog open={showAssignModal} onOpenChange={(open) => {
        setShowAssignModal(open);
        if (!open) {
          setAdminToAssign(null);
          setSelectedAdmin("");
          setSelectedSociety("");
        }
      }}>
        <DialogContent data-testid="modal-assign-admin">
          <DialogHeader>
            <DialogTitle>
              {adminToAssign ? `Assign Society for ${adminToAssign.firstName} ${adminToAssign.lastName}` : "Assign or Reassign Admin to Society"}
            </DialogTitle>
            <DialogDescription>
              {adminToAssign 
                ? `Select which society ${adminToAssign.firstName} should manage` 
                : "Assign an admin to manage a society. You can also reassign a different admin to a society that already has one."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {admins.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                <AlertCircle className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
                No admins available. Create a new admin first.
              </div>
            ) : societies.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                <AlertCircle className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
                No societies available
              </div>
            ) : (
              <>
                {!adminToAssign && (
                  <div>
                    <label className="text-sm font-medium mb-2 block">Select Admin</label>
                    <Select value={selectedAdmin} onValueChange={setSelectedAdmin}>
                      <SelectTrigger data-testid="select-admin-for-assignment">
                        <SelectValue placeholder="Choose an admin..." />
                      </SelectTrigger>
                      <SelectContent>
                        {admins.map((admin) => {
                          const assignedSociety = societies.find(s => s.id === admin.societyId);
                          return (
                            <SelectItem key={admin.id} value={admin.id} data-testid={`admin-assignment-option-${admin.id}`}>
                              {admin.firstName} {admin.lastName} ({admin.email})
                              {assignedSociety && (
                                <span className="text-muted-foreground text-xs ml-2">
                                  - Currently: {assignedSociety.name}
                                </span>
                              )}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                
                {adminToAssign && (
                  <div className="bg-muted/50 rounded-md p-3">
                    <p className="text-sm font-medium mb-1">Admin</p>
                    <p className="text-sm text-muted-foreground">
                      {adminToAssign.firstName} {adminToAssign.lastName} ({adminToAssign.email})
                    </p>
                    {adminToAssign.societyId && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Currently assigned to: {societies.find(s => s.id === adminToAssign.societyId)?.name || "Unknown"}
                      </p>
                    )}
                  </div>
                )}
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Select Society</label>
                  <Select value={selectedSociety} onValueChange={setSelectedSociety}>
                    <SelectTrigger data-testid="select-society-for-assignment">
                      <SelectValue placeholder="Choose a society..." />
                    </SelectTrigger>
                    <SelectContent>
                      {societies.map((society) => {
                        const currentAdmin = admins.find(a => a.id === society.adminId);
                        return (
                          <SelectItem key={society.id} value={society.id} data-testid={`society-assignment-option-${society.id}`}>
                            {society.name}
                            {currentAdmin && (
                              <span className="text-muted-foreground text-xs ml-2">
                                - Admin: {currentAdmin.firstName} {currentAdmin.lastName}
                              </span>
                            )}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
                {currentAdminForSelectedSociety && selectedAdmin && currentAdminForSelectedSociety.id !== selectedAdmin && (
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-3">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                      <AlertCircle className="h-4 w-4 inline mr-1" />
                      This will reassign the society. Current admin {currentAdminForSelectedSociety.firstName} {currentAdminForSelectedSociety.lastName} will be unassigned.
                    </p>
                  </div>
                )}
                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowAssignModal(false);
                      setAdminToAssign(null);
                      setSelectedAdmin("");
                      setSelectedSociety("");
                    }}
                    className="flex-1"
                    data-testid="button-cancel-assign"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleAssignAdmin}
                    disabled={!selectedAdmin || !selectedSociety || assignAdminMutation.isPending}
                    className="flex-1 bg-gradient-to-r from-secondary to-accent text-white"
                    data-testid="button-submit-assign"
                  >
                    {assignAdminMutation.isPending ? "Processing..." : (currentAdminForSelectedSociety && selectedAdmin && currentAdminForSelectedSociety.id !== selectedAdmin ? "Reassign Admin" : "Assign Admin")}
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
