import { useState } from "react";
import { motion } from "framer-motion";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Calendar, Clock } from "lucide-react";
import type { Facility } from "@shared/schema";

const bookingSchema = z.object({
  facilityId: z.string().min(1, "Please select a facility"),
  bookingDate: z.string().min(1, "Please select a date"),
  startTime: z.string().min(1, "Please select start time"),
  endTime: z.string().min(1, "Please select end time"),
  notes: z.string().optional(),
});

type BookingFormData = z.infer<typeof bookingSchema>;

interface FacilityBookingProps {
  inline?: boolean;
  onClose?: () => void;
}

export default function FacilityBooking({ inline = false, onClose }: FacilityBookingProps = {}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);

  const { data: facilities } = useQuery<Facility[]>({
    queryKey: ["/api/facilities"],
    enabled: inline || isOpen,
  });

  const form = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      facilityId: "",
      bookingDate: "",
      startTime: "",
      endTime: "",
      notes: "",
    },
  });

  const createBookingMutation = useMutation({
    mutationFn: async (data: BookingFormData) => {
      await apiRequest("POST", "/api/facility-bookings", data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Facility booking request submitted successfully",
      });
      form.reset();
      setIsOpen(false);
      onClose?.();
      queryClient.invalidateQueries({ queryKey: ["/api/facility-bookings"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: BookingFormData) => {
    createBookingMutation.mutate(data);
  };

  if (!isOpen && !inline) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="w-full bg-gradient-to-r from-secondary to-accent text-white hover:opacity-90 transition-opacity"
        data-testid="button-open-booking-form"
      >
        <Calendar className="h-4 w-4 mr-2" />
        Book Facility
      </Button>
    );
  }

  const formContent = (
    <Card className={!inline ? "w-full max-w-md mx-4" : ""}>
      {!inline && (
        <CardHeader>
          <CardTitle>Book Facility</CardTitle>
        </CardHeader>
      )}
      <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="facilityId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Facility</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-facility">
                          <SelectValue placeholder="Select a facility" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {facilities?.map((facility: any) => (
                          <SelectItem key={facility.id} value={facility.id}>
                            {facility.name}
                          </SelectItem>
                        )) || (
                          <>
                            <SelectItem value="gym">Gym</SelectItem>
                            <SelectItem value="clubhouse">Clubhouse</SelectItem>
                            <SelectItem value="swimming-pool">Swimming Pool</SelectItem>
                            <SelectItem value="guest-room">Guest Room</SelectItem>
                          </>
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bookingDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date</FormLabel>
                    <FormControl>
                      <Input 
                        type="date" 
                        {...field} 
                        min={new Date().toISOString().split('T')[0]}
                        data-testid="input-booking-date"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="startTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Time</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} data-testid="input-start-time" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="endTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Time</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} data-testid="input-end-time" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes (Optional)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Any special requirements..."
                        {...field}
                        data-testid="input-booking-notes"
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
                  data-testid="button-cancel-booking"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createBookingMutation.isPending}
                  className="flex-1 bg-gradient-to-r from-secondary to-accent text-white"
                  data-testid="button-submit-booking"
                >
                  {createBookingMutation.isPending ? "Booking..." : "Book Now"}
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
