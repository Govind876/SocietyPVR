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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { UserPlus, Eye, EyeOff } from "lucide-react";

const signupSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(3, "Password must be at least 3 characters"),
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  role: z.enum(["super_admin", "admin", "resident"], {
    required_error: "Please select a role",
  }),
  societyId: z.string().optional(),
});

type SignupFormData = z.infer<typeof signupSchema>;

interface SignupFormProps {
  onSuccess?: () => void;
  onSwitchToLogin?: () => void;
}

export default function SignupForm({ onSuccess, onSwitchToLogin }: SignupFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: "",
      password: "",
      firstName: "",
      lastName: "",
      role: undefined,
      societyId: "",
    },
  });

  const selectedRole = form.watch("role");

  const signupMutation = useMutation({
    mutationFn: async (data: SignupFormData) => {
      const response = await apiRequest("POST", "/api/auth/signup", data);
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: "Account created successfully! Welcome to SocietyHub.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast({
        title: "Signup Failed",
        description: error.message.includes("400") ? "Email already exists or missing required fields" : "Signup failed. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: SignupFormData) => {
    signupMutation.mutate(data);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold flex items-center justify-center gap-2">
            <UserPlus className="w-6 h-6 text-primary" />
            Create Account
          </CardTitle>
          <p className="text-muted-foreground">Join SocietyHub today</p>
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
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="John"
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
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Doe"
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
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="email"
                        placeholder="john.doe@example.com"
                        data-testid="input-email"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          {...field}
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter your password"
                          data-testid="input-password"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                          data-testid="button-toggle-password"
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-role">
                          <SelectValue placeholder="Select your role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="super_admin">Super Admin</SelectItem>
                        <SelectItem value="admin">Society Admin</SelectItem>
                        <SelectItem value="resident">Resident</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {(selectedRole === "admin" || selectedRole === "resident") && (
                <FormField
                  control={form.control}
                  name="societyId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Society ID</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Enter society ID"
                          data-testid="input-society-id"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              
              <Button
                type="submit"
                className="w-full"
                disabled={signupMutation.isPending}
                data-testid="button-signup"
              >
                {signupMutation.isPending ? "Creating account..." : "Create Account"}
              </Button>
            </form>
          </Form>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <Button
                variant="link"
                className="p-0 h-auto font-semibold"
                onClick={onSwitchToLogin}
                data-testid="link-login"
              >
                Sign in here
              </Button>
            </p>
          </div>

          <div className="mt-4 text-center">
            <p className="text-xs text-muted-foreground">
              Demo: Password should match the username part of your email
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}