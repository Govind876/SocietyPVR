import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { MapPin, Calendar, User, Tag, Edit, Trash2, MessageCircle } from "lucide-react";
import { format } from "date-fns";
import type { MarketplaceItem } from "@shared/schema";

interface MarketplaceItemCardProps {
  item: MarketplaceItem;
  isOwner?: boolean;
}

export function MarketplaceItemCard({ item, isOwner = false }: MarketplaceItemCardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateStatusMutation = useMutation({
    mutationFn: async (status: string) => {
      return await apiRequest(`/api/marketplace/${item.id}/status`, "PATCH", { status });
    },
    onSuccess: () => {
      toast({
        title: "Status Updated",
        description: "Item status has been updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/marketplace"] });
      queryClient.invalidateQueries({ queryKey: ["/api/marketplace/my-items"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteItemMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest(`/api/marketplace/${item.id}`, "DELETE");
    },
    onSuccess: () => {
      toast({
        title: "Item Deleted",
        description: "Your item has been removed from the marketplace",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/marketplace"] });
      queryClient.invalidateQueries({ queryKey: ["/api/marketplace/my-items"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "default";
      case "sold":
        return "secondary";
      case "reserved":
        return "outline";
      case "removed":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case "new":
        return "bg-green-100 text-green-800";
      case "like_new":
        return "bg-blue-100 text-blue-800";
      case "good":
        return "bg-yellow-100 text-yellow-800";
      case "fair":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleContactSeller = () => {
    if (item.sellerContact) {
      window.open(`tel:${item.sellerContact}`, '_blank');
    } else {
      toast({
        title: "Contact Info",
        description: `Contact ${item.sellerName} for more details about this item`,
      });
    }
  };

  const handleMarkAsSold = () => {
    updateStatusMutation.mutate("sold");
  };

  const handleMarkAsReserved = () => {
    updateStatusMutation.mutate("reserved");
  };

  const handleMarkAsActive = () => {
    updateStatusMutation.mutate("active");
  };

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this item?")) {
      deleteItemMutation.mutate();
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow duration-300 overflow-hidden">
      {/* Image placeholder */}
      <div className="h-48 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
        <Tag className="h-12 w-12 text-gray-400" />
      </div>

      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold text-lg line-clamp-1" data-testid={`item-title-${item.id}`}>
            {item.title}
          </h3>
          <Badge variant={getStatusColor(item.status)} data-testid={`item-status-${item.id}`}>
            {item.status}
          </Badge>
        </div>

        <p className="text-2xl font-bold text-primary mb-2" data-testid={`item-price-${item.id}`}>
          ₹{(item.price / 100).toLocaleString()}
        </p>

        <p className="text-muted-foreground text-sm line-clamp-2 mb-3" data-testid={`item-description-${item.id}`}>
          {item.description}
        </p>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium px-2 py-1 rounded-full bg-gray-100 text-gray-700">
              {item.category}
            </span>
            <span className={`text-xs font-medium px-2 py-1 rounded-full ${getConditionColor(item.condition)}`}>
              {item.condition.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <User className="h-3 w-3" />
              <span data-testid={`item-seller-${item.id}`}>{item.sellerName}</span>
            </div>
            {item.location && (
              <div className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                <span data-testid={`item-location-${item.id}`}>{item.location}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            <span data-testid={`item-date-${item.id}`}>
              {format(new Date(item.createdAt!), "MMM dd, yyyy")}
            </span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0">
        {isOwner ? (
          <div className="w-full space-y-2">
            {item.status === "active" && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleMarkAsReserved}
                  disabled={updateStatusMutation.isPending}
                  className="flex-1"
                  data-testid={`button-mark-reserved-${item.id}`}
                >
                  Mark Reserved
                </Button>
                <Button
                  size="sm"
                  onClick={handleMarkAsSold}
                  disabled={updateStatusMutation.isPending}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  data-testid={`button-mark-sold-${item.id}`}
                >
                  Mark Sold
                </Button>
              </div>
            )}
            
            {(item.status === "reserved" || item.status === "sold") && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleMarkAsActive}
                disabled={updateStatusMutation.isPending}
                className="w-full"
                data-testid={`button-mark-active-${item.id}`}
              >
                Mark as Active
              </Button>
            )}

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                data-testid={`button-edit-item-${item.id}`}
              >
                <Edit className="h-3 w-3 mr-1" />
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDelete}
                disabled={deleteItemMutation.isPending}
                className="flex-1 text-red-600 hover:text-red-700"
                data-testid={`button-delete-item-${item.id}`}
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Delete
              </Button>
            </div>
          </div>
        ) : (
          <Button
            onClick={handleContactSeller}
            disabled={item.status !== "active"}
            className="w-full bg-gradient-to-r from-primary to-accent text-white"
            data-testid={`button-contact-seller-${item.id}`}
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            Contact Seller
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}