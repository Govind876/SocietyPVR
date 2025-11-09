import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Settings, Shield, Database, Bell, Globe } from "lucide-react";

interface SystemSettingsModalProps {
  trigger?: React.ReactNode;
}

interface SystemSettingsType {
  security: {
    sessionTimeout: number;
    enforceStrongPasswords: boolean;
    enableTwoFactor: boolean;
    maxLoginAttempts: number;
  };
  notifications: {
    emailNotifications: boolean;
    smsNotifications: boolean;
    pushNotifications: boolean;
    maintenanceAlerts: boolean;
  };
  system: {
    maintenanceMode: boolean;
    autoBackup: boolean;
    logRetention: number;
    maxFileSize: number;
  };
  application: {
    systemName: string;
    contactEmail: string;
    maxSocieties: number;
    defaultLanguage: string;
  };
}

export function SystemSettingsModal({ trigger }: SystemSettingsModalProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Default settings structure
  const defaultSettings: SystemSettingsType = {
    security: {
      sessionTimeout: 60,
      enforceStrongPasswords: true,
      enableTwoFactor: false,
      maxLoginAttempts: 5,
    },
    notifications: {
      emailNotifications: true,
      smsNotifications: false,
      pushNotifications: true,
      maintenanceAlerts: true,
    },
    system: {
      maintenanceMode: false,
      autoBackup: true,
      logRetention: 30,
      maxFileSize: 10,
    },
    application: {
      systemName: "SocietyHub",
      contactEmail: "admin@societyhub.com",
      maxSocieties: 100,
      defaultLanguage: "en",
    }
  };

  // Fetch current settings from backend
  const { data: settings, isLoading } = useQuery<SystemSettingsType>({
    queryKey: ["/api/system/settings"],
    enabled: open,
  });

  // Local state for form data
  const [formSettings, setFormSettings] = useState<SystemSettingsType>(defaultSettings);

  // Update form settings when data is fetched
  useEffect(() => {
    if (settings && !isLoading && typeof settings === 'object') {
      // Merge with defaults to ensure all properties exist
      setFormSettings({
        ...defaultSettings,
        ...settings,
        security: { ...defaultSettings.security, ...settings.security },
        notifications: { ...defaultSettings.notifications, ...settings.notifications },
        system: { ...defaultSettings.system, ...settings.system },
        application: { ...defaultSettings.application, ...settings.application }
      });
    }
  }, [settings, isLoading]);

  // Save settings mutation
  const saveSettingsMutation = useMutation({
    mutationFn: async (newSettings: SystemSettingsType) => {
      return await apiRequest("/api/system/settings", "PUT", newSettings);
    },
    onSuccess: () => {
      toast({
        title: "Settings Saved",
        description: "System settings have been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/system/settings"] });
      setOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Save Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSaveSettings = () => {
    saveSettingsMutation.mutate(formSettings);
  };

  const handleResetToDefaults = () => {
    setFormSettings(defaultSettings);
    toast({
      title: "Settings Reset",
      description: "All settings have been reset to default values.",
    });
  };

  const updateSettings = (section: keyof SystemSettingsType, field: string, value: any) => {
    setFormSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button data-testid="button-system-settings-trigger">
            <Settings className="w-4 h-4 mr-2" />
            System Settings
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-y-auto" data-testid="modal-system-settings">
        <DialogHeader>
          <DialogTitle>System Settings</DialogTitle>
          <DialogDescription>
            Configure system-wide settings, security policies, and application preferences.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
              <p className="text-muted-foreground">Loading settings...</p>
            </div>
          </div>
        ) : (
          <Tabs defaultValue="security" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="security" data-testid="tab-security">Security</TabsTrigger>
              <TabsTrigger value="notifications" data-testid="tab-notifications">Notifications</TabsTrigger>
              <TabsTrigger value="system" data-testid="tab-system">System</TabsTrigger>
              <TabsTrigger value="application" data-testid="tab-application">Application</TabsTrigger>
            </TabsList>

          {/* Security Settings */}
          <TabsContent value="security" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Security Configuration
                </CardTitle>
                <CardDescription>
                  Configure authentication and security policies
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="session-timeout">Session Timeout (minutes)</Label>
                    <Input
                      id="session-timeout"
                      type="number"
                      value={formSettings.security.sessionTimeout}
                      onChange={(e) => updateSettings('security', 'sessionTimeout', Number(e.target.value))}
                      data-testid="input-session-timeout"
                    />
                  </div>
                  <div>
                    <Label htmlFor="max-login-attempts">Max Login Attempts</Label>
                    <Input
                      id="max-login-attempts"
                      type="number"
                      value={formSettings.security.maxLoginAttempts}
                      onChange={(e) => updateSettings('security', 'maxLoginAttempts', Number(e.target.value))}
                      data-testid="input-max-login-attempts"
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="strong-passwords">Enforce Strong Passwords</Label>
                      <p className="text-sm text-muted-foreground">Require complex passwords for all users</p>
                    </div>
                    <Switch
                      id="strong-passwords"
                      checked={formSettings.security.enforceStrongPasswords}
                      onCheckedChange={(checked) => updateSettings('security', 'enforceStrongPasswords', checked)}
                      data-testid="switch-strong-passwords"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="two-factor">Enable Two-Factor Authentication</Label>
                      <p className="text-sm text-muted-foreground">Require 2FA for admin accounts</p>
                    </div>
                    <Switch
                      id="two-factor"
                      checked={formSettings.security.enableTwoFactor}
                      onCheckedChange={(checked) => updateSettings('security', 'enableTwoFactor', checked)}
                      data-testid="switch-two-factor"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Settings */}
          <TabsContent value="notifications" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  Notification Preferences
                </CardTitle>
                <CardDescription>
                  Configure how the system sends notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="email-notifications">Email Notifications</Label>
                      <p className="text-sm text-muted-foreground">Send notifications via email</p>
                    </div>
                    <Switch
                      id="email-notifications"
                      checked={formSettings.notifications.emailNotifications}
                      onCheckedChange={(checked) => updateSettings('notifications', 'emailNotifications', checked)}
                      data-testid="switch-email-notifications"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="sms-notifications">SMS Notifications</Label>
                      <p className="text-sm text-muted-foreground">Send critical alerts via SMS</p>
                    </div>
                    <Switch
                      id="sms-notifications"
                      checked={formSettings.notifications.smsNotifications}
                      onCheckedChange={(checked) => updateSettings('notifications', 'smsNotifications', checked)}
                      data-testid="switch-sms-notifications"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="push-notifications">Push Notifications</Label>
                      <p className="text-sm text-muted-foreground">Send real-time push notifications</p>
                    </div>
                    <Switch
                      id="push-notifications"
                      checked={formSettings.notifications.pushNotifications}
                      onCheckedChange={(checked) => updateSettings('notifications', 'pushNotifications', checked)}
                      data-testid="switch-push-notifications"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="maintenance-alerts">Maintenance Alerts</Label>
                      <p className="text-sm text-muted-foreground">Notify users of maintenance schedules</p>
                    </div>
                    <Switch
                      id="maintenance-alerts"
                      checked={formSettings.notifications.maintenanceAlerts}
                      onCheckedChange={(checked) => updateSettings('notifications', 'maintenanceAlerts', checked)}
                      data-testid="switch-maintenance-alerts"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* System Settings */}
          <TabsContent value="system" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="w-5 h-5" />
                  System Configuration
                </CardTitle>
                <CardDescription>
                  Configure system maintenance and data retention
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="log-retention">Log Retention (days)</Label>
                    <Input
                      id="log-retention"
                      type="number"
                      value={formSettings.system.logRetention}
                      onChange={(e) => updateSettings('system', 'logRetention', Number(e.target.value))}
                      data-testid="input-log-retention"
                    />
                  </div>
                  <div>
                    <Label htmlFor="max-file-size">Max File Size (MB)</Label>
                    <Input
                      id="max-file-size"
                      type="number"
                      value={formSettings.system.maxFileSize}
                      onChange={(e) => updateSettings('system', 'maxFileSize', Number(e.target.value))}
                      data-testid="input-max-file-size"
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="maintenance-mode">Maintenance Mode</Label>
                      <p className="text-sm text-muted-foreground">Put the system in maintenance mode</p>
                    </div>
                    <Switch
                      id="maintenance-mode"
                      checked={formSettings.system.maintenanceMode}
                      onCheckedChange={(checked) => updateSettings('system', 'maintenanceMode', checked)}
                      data-testid="switch-maintenance-mode"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="auto-backup">Automatic Backup</Label>
                      <p className="text-sm text-muted-foreground">Enable automatic daily backups</p>
                    </div>
                    <Switch
                      id="auto-backup"
                      checked={formSettings.system.autoBackup}
                      onCheckedChange={(checked) => updateSettings('system', 'autoBackup', checked)}
                      data-testid="switch-auto-backup"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Application Settings */}
          <TabsContent value="application" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="w-5 h-5" />
                  Application Configuration
                </CardTitle>
                <CardDescription>
                  Configure application-specific settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="system-name">System Name</Label>
                    <Input
                      id="system-name"
                      value={formSettings.application.systemName}
                      onChange={(e) => updateSettings('application', 'systemName', e.target.value)}
                      data-testid="input-system-name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="contact-email">Contact Email</Label>
                    <Input
                      id="contact-email"
                      type="email"
                      value={formSettings.application.contactEmail}
                      onChange={(e) => updateSettings('application', 'contactEmail', e.target.value)}
                      data-testid="input-contact-email"
                    />
                  </div>
                  <div>
                    <Label htmlFor="max-societies">Max Societies</Label>
                    <Input
                      id="max-societies"
                      type="number"
                      value={formSettings.application.maxSocieties}
                      onChange={(e) => updateSettings('application', 'maxSocieties', Number(e.target.value))}
                      data-testid="input-max-societies"
                    />
                  </div>
                  <div>
                    <Label htmlFor="default-language">Default Language</Label>
                    <Input
                      id="default-language"
                      value={formSettings.application.defaultLanguage}
                      onChange={(e) => updateSettings('application', 'defaultLanguage', e.target.value)}
                      data-testid="input-default-language"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        )}

        <div className="flex gap-3 pt-4">
          <Button 
            variant="outline" 
            onClick={handleResetToDefaults}
            data-testid="button-reset-settings"
          >
            Reset to Defaults
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setOpen(false)}
            data-testid="button-cancel-settings"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSaveSettings}
            disabled={saveSettingsMutation.isPending}
            className="ml-auto"
            data-testid="button-save-settings"
          >
            {saveSettingsMutation.isPending ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}