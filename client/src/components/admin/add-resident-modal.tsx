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
import { X, UserPlus } from "lucide-react";
import { insertUserSchema } from "@shared/schema";

const createResidentSchema = insertUserSchema.pick({
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

type CreateResidentFormData = z.infer<typeof createResidentSchema>;

interface AddResidentModalProps {
  isOpen: boolean;
  onClose: () => void;
  trigger?: React.ReactNode;
}

export function AddResidentModal({ isOpen, onClose, trigger }: AddResidentModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<CreateResidentFormData>({
    resolver: zodResolver(createResidentSchema),
    defaultValues: {
      email: "",
      firstName: "",
      lastName: "",
      phoneNumber: "",
      flatNumber: "",
    },
  });

  const createResidentMutation = useMutation({
    mutationFn: async (data: CreateResidentFormData) => {
      return await apiRequest("/api/residents", "POST", data);
    },
    onSuccess: () => {
      toast({
        title: "Resident Added",
        description: "New resident has been successfully added to your society",
      });
      form.reset();
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

  const onSubmit = (data: CreateResidentFormData) => {
    createResidentMutation.mutate(data);
  };

  if (trigger && !isOpen) {
    return trigger;
  }

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
            <CardTitle className="flex items-center gap-2" data-testid="add-resident-title">
              <UserPlus className="h-5 w-5" />
              Add New Resident
            </CardTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              data-testid="button-close-modal"
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
                            data-testid="input-first-name"
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
                            data-testid="input-last-name"
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
                          data-testid="input-email"
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
                          data-testid="input-flat-number"
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
                          data-testid="input-phone-number"
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
                    data-testid="button-cancel-add"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={createResidentMutation.isPending}
                    className="flex-1 bg-gradient-to-r from-primary to-accent text-white"
                    data-testid="button-add-resident"
                  >
                    {createResidentMutation.isPending ? "Adding..." : "Add Resident"}
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