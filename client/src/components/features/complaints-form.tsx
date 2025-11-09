import { useState } from "react";
import { motion } from "framer-motion";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { AlertCircle } from "lucide-react";

const complaintSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  category: z.string().min(1, "Please select a category"),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
});

type ComplaintFormData = z.infer<typeof complaintSchema>;

interface ComplaintsFormProps {
  inline?: boolean;
  onClose?: () => void;
}

export default function ComplaintsForm({ inline = false, onClose }: ComplaintsFormProps = {}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);

  const form = useForm<ComplaintFormData>({
    resolver: zodResolver(complaintSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "",
      priority: "medium",
    },
  });

  const createComplaintMutation = useMutation({
    mutationFn: async (data: ComplaintFormData) => {
      await apiRequest("/api/complaints", "POST", data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Complaint submitted successfully",
      });
      form.reset();
      setIsOpen(false);
      onClose?.();
      queryClient.invalidateQueries({ queryKey: ["/api/complaints"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ComplaintFormData) => {
    createComplaintMutation.mutate(data);
  };

  if (!isOpen && !inline) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="w-full bg-gradient-to-r from-primary to-accent text-white hover:opacity-90 transition-opacity"
        data-testid="button-open-complaint-form"
      >
        <AlertCircle className="h-4 w-4 mr-2" />
        Raise Complaint
      </Button>
    );
  }

  const formContent = (
    <Card className={!inline ? "w-full max-w-md mx-4" : ""}>
      {!inline && (
        <CardHeader>
          <CardTitle>Submit Complaint</CardTitle>
        </CardHeader>
      )}
      <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Brief title of the issue" {...field} data-testid="input-complaint-title" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-complaint-category">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="plumbing">Plumbing</SelectItem>
                        <SelectItem value="electrical">Electrical</SelectItem>
                        <SelectItem value="security">Security</SelectItem>
                        <SelectItem value="maintenance">Maintenance</SelectItem>
                        <SelectItem value="cleaning">Cleaning</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-complaint-priority">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Detailed description of the issue"
                        className="min-h-[100px]"
                        {...field}
                        data-testid="textarea-complaint-description"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsOpen(false);
                    onClose?.();
                  }}
                  className="flex-1"
                  data-testid="button-cancel-complaint"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createComplaintMutation.isPending}
                  className="flex-1 bg-gradient-to-r from-primary to-accent text-white"
                  data-testid="button-submit-complaint"
                >
                  {createComplaintMutation.isPending ? "Submitting..." : "Submit"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
  );

  return inline ? formContent : (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
    >
      {formContent}
    </motion.div>
  );
}
