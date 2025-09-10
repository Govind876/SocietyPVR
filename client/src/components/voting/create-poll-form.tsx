import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Plus, X } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { insertPollSchema } from "@shared/schema";
import * as z from "zod";

const createPollFormSchema = insertPollSchema.extend({
  options: z.array(z.string().min(1, "Option cannot be empty")).min(2, "At least 2 options required"),
});

type CreatePollFormData = z.infer<typeof createPollFormSchema>;

interface CreatePollFormProps {
  onCancel?: () => void;
  onSuccess?: () => void;
}

export function CreatePollForm({ onCancel, onSuccess }: CreatePollFormProps) {
  const [options, setOptions] = useState<string[]>(["", ""]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<CreatePollFormData>({
    resolver: zodResolver(createPollFormSchema),
    defaultValues: {
      title: "",
      description: "",
      pollType: "single_choice",
      isAnonymous: false,
      status: "draft",
      options: ["", ""],
    },
  });

  const createPollMutation = useMutation({
    mutationFn: async (data: CreatePollFormData) => {
      return await apiRequest("/api/polls", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast({
        title: "Poll Created",
        description: "Your poll has been created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/polls"] });
      onSuccess?.();
    },
    onError: (error) => {
      toast({
        title: "Failed to Create Poll",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const addOption = () => {
    const newOptions = [...options, ""];
    setOptions(newOptions);
    form.setValue("options", newOptions);
  };

  const removeOption = (index: number) => {
    if (options.length <= 2) return; // Keep at least 2 options
    const newOptions = options.filter((_, i) => i !== index);
    setOptions(newOptions);
    form.setValue("options", newOptions);
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
    form.setValue("options", newOptions);
  };

  const onSubmit = (data: CreatePollFormData) => {
    // Filter out empty options
    const filteredOptions = data.options.filter(option => option.trim() !== "");
    if (filteredOptions.length < 2) {
      toast({
        title: "Invalid Options",
        description: "Please provide at least 2 non-empty options.",
        variant: "destructive",
      });
      return;
    }

    createPollMutation.mutate({
      ...data,
      options: filteredOptions,
    });
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card data-testid="create-poll-form">
        <CardHeader>
          <CardTitle data-testid="create-poll-title">Create New Poll</CardTitle>
          <CardDescription>
            Create a poll for your society members to vote on important decisions.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Poll Title *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g., Should we install new playground equipment?"
                          {...field}
                          data-testid="input-poll-title"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description *</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Provide more details about what this poll is about..."
                          className="min-h-[100px]"
                          {...field}
                          data-testid="textarea-poll-description"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Poll Settings */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Poll Settings</h3>
                
                <FormField
                  control={form.control}
                  name="pollType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Poll Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-poll-type">
                            <SelectValue placeholder="Select poll type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="single_choice">Single Choice</SelectItem>
                          <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                          <SelectItem value="yes_no">Yes/No</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Single choice allows one option, multiple choice allows many, yes/no is for simple decisions.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Date & Time *</FormLabel>
                      <FormControl>
                        <Input 
                          type="datetime-local"
                          {...field}
                          data-testid="input-poll-end-date"
                        />
                      </FormControl>
                      <FormDescription>
                        When should this poll close for voting?
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isAnonymous"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Anonymous Voting</FormLabel>
                        <FormDescription>
                          When enabled, individual votes will not be visible to administrators.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="switch-anonymous-voting"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              {/* Poll Options */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Poll Options</h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addOption}
                    data-testid="button-add-option"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Option
                  </Button>
                </div>

                <div className="space-y-3">
                  {options.map((option, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="flex-1">
                        <Input
                          placeholder={`Option ${index + 1}`}
                          value={option}
                          onChange={(e) => updateOption(index, e.target.value)}
                          data-testid={`input-option-${index}`}
                        />
                      </div>
                      {options.length > 2 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeOption(index)}
                          data-testid={`button-remove-option-${index}`}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
                <p className="text-sm text-gray-500">
                  At least 2 options are required. You can add more by clicking "Add Option".
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                {onCancel && (
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={onCancel}
                    className="flex-1"
                    data-testid="button-cancel-poll"
                  >
                    Cancel
                  </Button>
                )}
                <Button 
                  type="submit" 
                  disabled={createPollMutation.isPending}
                  className="flex-1"
                  data-testid="button-create-poll"
                >
                  {createPollMutation.isPending ? "Creating..." : "Create Poll"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}