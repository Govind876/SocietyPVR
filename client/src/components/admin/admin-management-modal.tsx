import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ShieldQuestion, Users, Building, AlertCircle, CheckCircle, XCircle } from "lucide-react";
import type { User, Society } from "@shared/schema";

interface AdminManagementModalProps {
  trigger?: React.ReactNode;
}

export function AdminManagementModal({ trigger }: AdminManagementModalProps) {
  const [open, setOpen] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<string>("");
  const [selectedSociety, setSelectedSociety] = useState<string>("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch unassigned admins
  const { data: unassignedAdmins = [], isLoading: loadingAdmins } = useQuery<User[]>({
    queryKey: ["/api/admins/unassigned"],
    enabled: open,
  });

  // Fetch all societies
  const { data: societies = [], isLoading: loadingSocieties } = useQuery<Society[]>({
    queryKey: ["/api/societies"],
    enabled: open,
  });

  // Assign admin mutation
  const assignAdminMutation = useMutation({
    mutationFn: async ({ societyId, adminId }: { societyId: string; adminId: string }) => {
      return await apiRequest("POST", `/api/societies/${societyId}/assign-admin`, { adminId });
    },
    onSuccess: () => {
      toast({
        title: "Admin Assigned",
        description: "Admin has been successfully assigned to the society.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admins/unassigned"] });
      queryClient.invalidateQueries({ queryKey: ["/api/societies"] });
      setSelectedAdmin("");
      setSelectedSociety("");
    },
    onError: (error) => {
      toast({
        title: "Assignment Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Remove admin mutation
  const removeAdminMutation = useMutation({
    mutationFn: async (societyId: string) => {
      return await apiRequest("DELETE", `/api/societies/${societyId}/admin`, {});
    },
    onSuccess: () => {
      toast({
        title: "Admin Removed",
        description: "Admin has been successfully removed from the society.",
      });
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

  const handleAssignAdmin = () => {
    if (!selectedAdmin || !selectedSociety) {
      toast({
        title: "Selection Required",
        description: "Please select both an admin and a society.",
        variant: "destructive",
      });
      return;
    }
    assignAdminMutation.mutate({ societyId: selectedSociety, adminId: selectedAdmin });
  };

  const handleRemoveAdmin = (societyId: string) => {
    removeAdminMutation.mutate(societyId);
  };

  const societiesWithAdmins = societies.filter(society => society.adminId);
  const societiesWithoutAdmins = societies.filter(society => !society.adminId);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button data-testid="button-admin-management-trigger">
            <ShieldQuestion className="w-4 h-4 mr-2" />
            Manage Admins
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-y-auto" data-testid="modal-admin-management">
        <DialogHeader>
          <DialogTitle>Admin Management</DialogTitle>
          <DialogDescription>
            Assign admins to societies or remove existing assignments. Each society can have only one admin.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Assign New Admin Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Assign Admin to Society
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {unassignedAdmins.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  <AlertCircle className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
                  No unassigned admins available
                </div>
              ) : societiesWithoutAdmins.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-500" />
                  All societies have admins assigned
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Select Admin</label>
                      <Select value={selectedAdmin} onValueChange={setSelectedAdmin}>
                        <SelectTrigger data-testid="select-admin">
                          <SelectValue placeholder="Choose an admin..." />
                        </SelectTrigger>
                        <SelectContent>
                          {unassignedAdmins.map((admin) => (
                            <SelectItem key={admin.id} value={admin.id} data-testid={`admin-option-${admin.id}`}>
                              {admin.firstName} {admin.lastName} ({admin.email})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">Select Society</label>
                      <Select value={selectedSociety} onValueChange={setSelectedSociety}>
                        <SelectTrigger data-testid="select-society">
                          <SelectValue placeholder="Choose a society..." />
                        </SelectTrigger>
                        <SelectContent>
                          {societiesWithoutAdmins.map((society) => (
                            <SelectItem key={society.id} value={society.id} data-testid={`society-option-${society.id}`}>
                              {society.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Button 
                    onClick={handleAssignAdmin}
                    disabled={!selectedAdmin || !selectedSociety || assignAdminMutation.isPending}
                    className="w-full"
                    data-testid="button-assign-admin"
                  >
                    {assignAdminMutation.isPending ? "Assigning..." : "Assign Admin"}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          {/* Current Assignments Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="w-5 h-5" />
                Current Admin Assignments ({societiesWithAdmins.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {societiesWithAdmins.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <XCircle className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  No admins currently assigned to societies
                </div>
              ) : (
                <div className="space-y-3">
                  {societiesWithAdmins.map((society) => (
                    <div 
                      key={society.id} 
                      className="flex items-center justify-between p-3 bg-muted rounded-lg"
                      data-testid={`admin-assignment-${society.id}`}
                    >
                      <div className="flex-1">
                        <div className="font-medium text-foreground">{society.name}</div>
                        <div className="text-sm text-muted-foreground">
                          Admin ID: {society.adminId}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">Assigned</Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveAdmin(society.id)}
                          disabled={removeAdminMutation.isPending}
                          data-testid={`button-remove-admin-${society.id}`}
                        >
                          {removeAdminMutation.isPending ? "Removing..." : "Remove"}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{societies.length}</div>
                <div className="text-sm text-muted-foreground">Total Societies</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">{societiesWithAdmins.length}</div>
                <div className="text-sm text-muted-foreground">With Admins</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-orange-600">{unassignedAdmins.length}</div>
                <div className="text-sm text-muted-foreground">Unassigned Admins</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}