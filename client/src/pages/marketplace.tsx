import { useState } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/layout/navbar";
import { useAuth } from "@/hooks/useAuth";
import { Plus, Search, Filter, Package, Tag, MapPin, User, Calendar } from "lucide-react";
import { format } from "date-fns";
import type { MarketplaceItem } from "@shared/schema";
import { CreateMarketplaceItemModal } from "../components/marketplace/create-item-modal";
import { MarketplaceItemCard } from "../components/marketplace/item-card";

export default function Marketplace() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedCondition, setSelectedCondition] = useState<string>("");
  const [showCreateModal, setShowCreateModal] = useState(false);

  const { data: items = [], isLoading: itemsLoading } = useQuery<MarketplaceItem[]>({
    queryKey: ["/api/marketplace"],
    enabled: isAuthenticated,
  });

  const { data: myItems = [] } = useQuery<MarketplaceItem[]>({
    queryKey: ["/api/marketplace/my-items"],
    enabled: isAuthenticated,
  });

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const categories = [
    "Electronics", "Furniture", "Appliances", "Books", "Clothing", 
    "Sports", "Toys", "Kitchen", "Decor", "Tools", "Other"
  ];

  const conditions = ["new", "like_new", "good", "fair"];

  const filteredItems = items.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || item.category === selectedCategory;
    const matchesCondition = !selectedCondition || item.condition === selectedCondition;
    return matchesSearch && matchesCategory && matchesCondition;
  });

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
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2" data-testid="text-marketplace-title">
                <Package className="h-8 w-8 text-primary" />
                Society Marketplace
              </h1>
              <p className="text-muted-foreground mt-2">Buy and sell items within your community</p>
            </div>
            
            <CreateMarketplaceItemModal
              isOpen={showCreateModal}
              onClose={() => setShowCreateModal(false)}
              trigger={
                <Button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-gradient-to-r from-primary to-accent text-white hover:opacity-90 transition-opacity"
                  data-testid="button-sell-item"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Sell Item
                </Button>
              }
            />
          </motion.div>

          {/* Filters */}
          <motion.div
            className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
                data-testid="input-search-items"
              />
            </div>
            
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger data-testid="select-category-filter">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Categories</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedCondition} onValueChange={setSelectedCondition}>
              <SelectTrigger data-testid="select-condition-filter">
                <SelectValue placeholder="All Conditions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Conditions</SelectItem>
                {conditions.map(condition => (
                  <SelectItem key={condition} value={condition}>
                    {condition.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm("");
                setSelectedCategory("");
                setSelectedCondition("");
              }}
              data-testid="button-clear-filters"
            >
              <Filter className="h-4 w-4 mr-2" />
              Clear Filters
            </Button>
          </motion.div>

          {/* My Items Section */}
          {myItems.length > 0 && (
            <motion.div
              className="mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    My Listed Items ({myItems.length})
                  </CardTitle>
                  <CardDescription>
                    Items you've listed for sale
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {myItems.slice(0, 4).map((item) => (
                      <MarketplaceItemCard
                        key={item.id}
                        item={item}
                        isOwner={true}
                        data-testid={`my-item-card-${item.id}`}
                      />
                    ))}
                  </div>
                  {myItems.length > 4 && (
                    <div className="mt-4 text-center">
                      <Button variant="outline" data-testid="button-view-all-my-items">
                        View All My Items ({myItems.length})
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Items Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            {itemsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <div className="h-48 bg-gray-200 rounded-t-lg"></div>
                    <CardContent className="p-4">
                      <div className="h-4 bg-gray-200 rounded mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredItems.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredItems.map((item) => (
                  <MarketplaceItemCard
                    key={item.id}
                    item={item}
                    isOwner={item.sellerId === user?.id}
                    data-testid={`item-card-${item.id}`}
                  />
                ))}
              </div>
            ) : (
              <Card className="text-center py-12">
                <CardContent>
                  <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">No items found</h3>
                  <p className="text-gray-500 mb-4">
                    {searchTerm || selectedCategory || selectedCondition
                      ? "Try adjusting your search filters"
                      : "Be the first to list an item for sale!"}
                  </p>
                  <Button
                    onClick={() => setShowCreateModal(true)}
                    className="bg-gradient-to-r from-primary to-accent text-white"
                    data-testid="button-list-first-item"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    List Your First Item
                  </Button>
                </CardContent>
              </Card>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}