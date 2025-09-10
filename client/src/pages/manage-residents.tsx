import { useState } from "react";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import Navbar from "@/components/layout/navbar";
import { useAuth } from "@/hooks/useAuth";
import { Users, Search, Edit, Trash2, UserPlus, ArrowLeft } from "lucide-react";
import type { User } from "@shared/schema";
import { AddResidentModal } from "@/components/admin/add-resident-modal";
import { EditResidentModal } from "../components/admin/edit-resident-modal";

export default function ManageResidents() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingResident, setEditingResident] = useState<User | null>(null);

  const { data: residents = [], isLoading: residentsLoading } = useQuery<User[]>({
    queryKey: ["/api/residents"],
    enabled: isAuthenticated && user?.role !== 'resident',
  });

  const deleteResidentMutation = useMutation({
    mutationFn: async (residentId: string) => {
      return await apiRequest(`/api/residents/${residentId}`, "DELETE");
    },
    onSuccess: () => {
      toast({
        title: "Resident Deleted",
        description: "The resident has been successfully removed from your society",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/residents"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const filteredResidents = residents.filter(resident => {
    const searchLower = searchTerm.toLowerCase();
    return (
      resident.firstName?.toLowerCase().includes(searchLower) ||
      resident.lastName?.toLowerCase().includes(searchLower) ||
      resident.email?.toLowerCase().includes(searchLower) ||
      resident.flatNumber?.toLowerCase().includes(searchLower)
    );
  });

  const handleDeleteResident = (residentId: string, residentName: string) => {
    if (window.confirm(`Are you sure you want to delete ${residentName}? This action cannot be undone.`)) {
      deleteResidentMutation.mutate(residentId);
    }
  };

  const handleEditResident = (resident: User) => {
    setEditingResident(resident);
  };

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
                onClick={() => window.history.back()}
                className="flex items-center gap-2"
                data-testid="button-back"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2" data-testid="text-manage-residents-title">
                  <Users className="h-8 w-8 text-primary" />
                  Manage Residents
                </h1>
                <p className="text-muted-foreground mt-2">Add, edit, and manage residents in your society</p>
              </div>
            </div>
            
            <Button
              onClick={() => setShowAddModal(true)}
              className="bg-gradient-to-r from-primary to-accent text-white hover:opacity-90 transition-opacity"
              data-testid="button-add-resident"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Add Resident
            </Button>
          </motion.div>

          {/* Search and Stats */}
          <motion.div
            className="flex flex-col md:flex-row gap-4 mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search residents by name, email, or flat number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
                data-testid="input-search-residents"
              />
            </div>
            
            <div className="flex items-center gap-4">
              <Badge variant="secondary" className="text-sm">
                Total: {filteredResidents.length} residents
              </Badge>
            </div>
          </motion.div>

          {/* Residents Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Residents List</CardTitle>
              </CardHeader>
              <CardContent>
                {residentsLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="text-muted-foreground mt-2">Loading residents...</p>
                  </div>
                ) : filteredResidents.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Flat Number</TableHead>
                          <TableHead>Phone</TableHead>
                          <TableHead>Joined</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredResidents.map((resident) => (
                          <TableRow key={resident.id} data-testid={`resident-row-${resident.id}`}>
                            <TableCell className="font-medium">
                              <div className="flex flex-col">
                                <span>{`${resident.firstName || ""} ${resident.lastName || ""}`.trim() || "No Name"}</span>
                              </div>
                            </TableCell>
                            <TableCell data-testid={`resident-email-${resident.id}`}>
                              {resident.email || "No email"}
                            </TableCell>
                            <TableCell data-testid={`resident-flat-${resident.id}`}>
                              {resident.flatNumber || "Not assigned"}
                            </TableCell>
                            <TableCell data-testid={`resident-phone-${resident.id}`}>
                              {resident.phoneNumber || "Not provided"}
                            </TableCell>
                            <TableCell data-testid={`resident-joined-${resident.id}`}>
                              {resident.createdAt ? new Date(resident.createdAt).toLocaleDateString() : "Unknown"}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEditResident(resident)}
                                  data-testid={`button-edit-resident-${resident.id}`}
                                >
                                  <Edit className="h-3 w-3 mr-1" />
                                  Edit
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDeleteResident(
                                    resident.id, 
                                    `${resident.firstName || ""} ${resident.lastName || ""}`.trim() || "this resident"
                                  )}
                                  disabled={deleteResidentMutation.isPending}
                                  className="text-red-600 hover:text-red-700"
                                  data-testid={`button-delete-resident-${resident.id}`}
                                >
                                  <Trash2 className="h-3 w-3 mr-1" />
                                  Delete
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-600 mb-2">No residents found</h3>
                    <p className="text-gray-500 mb-4">
                      {searchTerm ? "Try adjusting your search terms" : "Start by adding your first resident"}
                    </p>
                    <Button
                      onClick={() => setShowAddModal(true)}
                      className="bg-gradient-to-r from-primary to-accent text-white"
                      data-testid="button-add-first-resident"
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Add Your First Resident
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Modals */}
      <AddResidentModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
      />
      
      {editingResident && (
        <EditResidentModal
          isOpen={!!editingResident}
          onClose={() => setEditingResident(null)}
          resident={editingResident}
        />
      )}
    </div>
  );
}