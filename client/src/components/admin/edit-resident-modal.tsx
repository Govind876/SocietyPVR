import { useState } from "react";
import { motion } from "framer-motion";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { X, UserCog } from "lucide-react";
import { insertUserSchema, type User } from "@shared/schema";

const editResidentSchema = insertUserSchema.pick({
  email: true,
  firstName: true,
  lastName: true,
  phoneNumber: true,
  flatNumber: true,
}).extend({
  email: z.string().email("Please enter a valid email address"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  phoneNumber: z.string().optional(),
  flatNumber: z.string().min(1, "Flat number is required"),
});

type EditResidentFormData = z.infer<typeof editResidentSchema>;

interface EditResidentModalProps {
  isOpen: boolean;
  onClose: () => void;
  resident: User;
}

export function EditResidentModal({ isOpen, onClose, resident }: EditResidentModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<EditResidentFormData>({
    resolver: zodResolver(editResidentSchema),
    defaultValues: {
      email: resident.email || "",
      firstName: resident.firstName || "",
      lastName: resident.lastName || "",
      phoneNumber: resident.phoneNumber || "",
      flatNumber: resident.flatNumber || "",
    },
  });

  const updateResidentMutation = useMutation({
    mutationFn: async (data: EditResidentFormData) => {
      return await apiRequest(`/api/residents/${resident.id}`, "PATCH", data);
    },
    onSuccess: () => {
      toast({
        title: "Resident Updated",
        description: "Resident information has been successfully updated",
      });
      onClose();
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

  const onSubmit = (data: EditResidentFormData) => {
    updateResidentMutation.mutate(data);
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="w-full max-w-md mx-4"
      >
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2" data-testid="edit-resident-title">
              <UserCog className="h-5 w-5" />
              Edit Resident
            </CardTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              data-testid="button-close-edit-modal"
            >
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                            data-testid="input-edit-first-name"
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
                            data-testid="input-edit-last-name"
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
                          placeholder="john.doe@example.com"
                          {...field}
                          data-testid="input-edit-email"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="flatNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Flat Number *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="101, A-101, etc."
                          {...field}
                          data-testid="input-edit-flat-number"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phoneNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number (Optional)</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="+91 9876543210"
                          {...field}
                          value={field.value || ""}
                          data-testid="input-edit-phone-number"
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
                    onClick={onClose}
                    className="flex-1"
                    data-testid="button-cancel-edit"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={updateResidentMutation.isPending}
                    className="flex-1 bg-gradient-to-r from-primary to-accent text-white"
                    data-testid="button-update-resident"
                  >
                    {updateResidentMutation.isPending ? "Updating..." : "Update Resident"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}