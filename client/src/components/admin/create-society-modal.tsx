import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { PlusCircle } from "lucide-react";
import { insertSocietySchema } from "@shared/schema";
import { z } from "zod";

const createSocietyFormSchema = insertSocietySchema.extend({
  name: z.string().min(1, "Society name is required").max(100, "Society name must be less than 100 characters"),
  address: z.string().min(1, "Address is required").max(500, "Address must be less than 500 characters"),
  totalFlats: z.number().min(1, "Total flats must be at least 1").max(10000, "Total flats cannot exceed 10,000"),
});

type CreateSocietyFormData = z.infer<typeof createSocietyFormSchema>;

interface CreateSocietyModalProps {
  trigger?: React.ReactNode;
}

export function CreateSocietyModal({ trigger }: CreateSocietyModalProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<CreateSocietyFormData>({
    resolver: zodResolver(createSocietyFormSchema),
    defaultValues: {
      name: "",
      address: "",
      totalFlats: 0,
    },
  });

  const createSocietyMutation = useMutation({
    mutationFn: async (data: CreateSocietyFormData) => {
      return await apiRequest("POST", "/api/societies", data);
    },
    onSuccess: () => {
      toast({
        title: "Society Created",
        description: "The society has been created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/societies"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      setOpen(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Failed to Create Society",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CreateSocietyFormData) => {
    createSocietyMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button data-testid="button-create-society-trigger">
            <PlusCircle className="w-4 h-4 mr-2" />
            Add Society
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md md:max-w-lg" data-testid="modal-create-society">
        <DialogHeader>
          <DialogTitle>Create New Society</DialogTitle>
          <DialogDescription>
            Add a new residential society to the system. Fill in all required details.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Society Name *</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g., Green Valley Apartments"
                      {...field}
                      data-testid="input-society-name"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address *</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Complete address with city and pincode"
                      className="min-h-[80px]"
                      {...field}
                      data-testid="textarea-society-address"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="totalFlats"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Total Flats *</FormLabel>
                  <FormControl>
                    <Input 
                      type="number"
                      placeholder="100"
                      value={field.value?.toString() || ""}
                      onChange={(e) => {
                        const value = e.target.value;
                        field.onChange(value === "" ? 0 : parseInt(value, 10) || 0);
                      }}
                      data-testid="input-total-flats"
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
                onClick={() => setOpen(false)}
                className="flex-1"
                data-testid="button-cancel-society"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createSocietyMutation.isPending}
                className="flex-1"
                data-testid="button-submit-society"
              >
                {createSocietyMutation.isPending ? "Creating..." : "Create Society"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}