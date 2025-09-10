import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { CreateSocietyModal } from "./create-society-modal";
import { Building, Users, MapPin, Search, Plus } from "lucide-react";
import { format } from "date-fns";
import type { Society } from "@shared/schema";

export function SocietiesManagement() {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: societies = [], isLoading, error } = useQuery<Society[]>({
    queryKey: ["/api/societies"],
  });

  const filteredSocieties = societies.filter(society =>
    society.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    society.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6" data-testid="societies-management">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            Society Management
          </h1>
          <p className="text-gray-600 mt-1">
            Manage all registered residential societies
          </p>
        </div>
        <CreateSocietyModal />
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4 md:p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search societies by name or address..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="input-search-societies"
              />
            </div>
            <CreateSocietyModal 
              trigger={
                <Button className="w-full sm:w-auto" data-testid="button-add-society-header">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Society
                </Button>
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Societies Grid */}
      {isLoading ? (
        <div className="text-center py-8" data-testid="societies-loading">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading societies...</p>
        </div>
      ) : error ? (
        <div className="text-center py-8 text-red-600" data-testid="societies-error">
          Failed to load societies. Please try again.
        </div>
      ) : filteredSocieties.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Building className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? "No societies found" : "No societies yet"}
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm 
                ? "Try adjusting your search terms" 
                : "Get started by creating your first society"}
            </p>
            {!searchTerm && (
              <CreateSocietyModal 
                trigger={
                  <Button data-testid="button-create-first-society">
                    <Plus className="w-4 h-4 mr-2" />
                    Create First Society
                  </Button>
                }
              />
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6" data-testid="societies-grid">
          {filteredSocieties.map((society) => (
            <Card key={society.id} className="hover:shadow-lg transition-shadow duration-300">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg font-semibold truncate" data-testid={`society-name-${society.id}`}>
                      {society.name}
                    </CardTitle>
                    <Badge variant="secondary" className="mt-1" data-testid={`society-status-${society.id}`}>
                      Active
                    </Badge>
                  </div>
                  <Building className="w-5 h-5 text-primary flex-shrink-0 ml-2" />
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-gray-600 line-clamp-2" data-testid={`society-address-${society.id}`}>
                    {society.address}
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-2">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600" data-testid={`society-flats-${society.id}`}>
                      {society.totalFlats} flats
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t">
                  <p className="text-xs text-gray-500" data-testid={`society-created-${society.id}`}>
                    Created {society.createdAt ? format(new Date(society.createdAt), "MMM dd, yyyy") : "Unknown"}
                  </p>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    data-testid={`button-edit-society-${society.id}`}
                  >
                    Edit
                  </Button>
                  <Button 
                    size="sm" 
                    className="flex-1"
                    data-testid={`button-manage-society-${society.id}`}
                  >
                    Manage
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}