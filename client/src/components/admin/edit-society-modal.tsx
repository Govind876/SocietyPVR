import { useState, useEffect } from "react";
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
import { insertSocietySchema } from "@shared/schema";
import { z } from "zod";
import type { Society } from "@shared/schema";

const editSocietyFormSchema = insertSocietySchema.extend({
  name: z.string().min(1, "Society name is required").max(100, "Society name must be less than 100 characters"),
  address: z.string().min(1, "Address is required").max(500, "Address must be less than 500 characters"),
  totalFlats: z.number().min(1, "Total flats must be at least 1").max(10000, "Total flats cannot exceed 10,000"),
});

type EditSocietyFormData = z.infer<typeof editSocietyFormSchema>;

interface EditSocietyModalProps {
  society: Society;
  trigger?: React.ReactNode;
}

export function EditSocietyModal({ society, trigger }: EditSocietyModalProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<EditSocietyFormData>({
    resolver: zodResolver(editSocietyFormSchema),
    defaultValues: {
      name: society.name,
      address: society.address,
      totalFlats: society.totalFlats || 0,
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        name: society.name,
        address: society.address,
        totalFlats: society.totalFlats || 0,
      });
    }
  }, [open, society, form]);

  const updateSocietyMutation = useMutation({
    mutationFn: async (data: EditSocietyFormData) => {
      return await apiRequest(`/api/societies/${society.id}`, "PATCH", data);
    },
    onSuccess: () => {
      toast({
        title: "Society Updated",
        description: "The society details have been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/societies"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      setOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Failed to Update Society",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: EditSocietyFormData) => {
    updateSocietyMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" data-testid={`button-edit-society-${society.id}`}>
            Edit
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md md:max-w-lg" data-testid="modal-edit-society">
        <DialogHeader>
          <DialogTitle>Edit Society</DialogTitle>
          <DialogDescription>
            Update the society details. All fields are required.
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
                      data-testid="input-edit-society-name"
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
                      data-testid="textarea-edit-society-address"
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
                      data-testid="input-edit-total-flats"
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
                data-testid="button-cancel-edit-society"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={updateSocietyMutation.isPending}
                className="flex-1"
                data-testid="button-submit-edit-society"
              >
                {updateSocietyMutation.isPending ? "Updating..." : "Update Society"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
