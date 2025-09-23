import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Database, Download, Upload, Clock, CheckCircle, AlertTriangle, Info } from "lucide-react";

interface BackupRestoreModalProps {
  trigger?: React.ReactNode;
}

export function BackupRestoreModal({ trigger }: BackupRestoreModalProps) {
  const [open, setOpen] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [backupProgress, setBackupProgress] = useState(0);
  const [restoreProgress, setRestoreProgress] = useState(0);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch backup history from backend
  const { data: backupHistory = [], isLoading } = useQuery({
    queryKey: ["/api/system/backups"],
    enabled: open,
  });

  // Create backup mutation
  const createBackupMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/system/backups", {});
    },
    onSuccess: () => {
      toast({
        title: "Backup Created",
        description: "Database backup has been created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/system/backups"] });
      setIsBackingUp(false);
      setBackupProgress(0);
    },
    onError: (error) => {
      toast({
        title: "Backup Failed",
        description: error.message,
        variant: "destructive",
      });
      setIsBackingUp(false);
      setBackupProgress(0);
    },
  });

  // Restore backup mutation
  const restoreBackupMutation = useMutation({
    mutationFn: async (backupId: number) => {
      return await apiRequest("POST", `/api/system/backups/${backupId}/restore`, {});
    },
    onSuccess: () => {
      toast({
        title: "Backup Restored",
        description: "Database has been restored successfully.",
      });
      setIsRestoring(false);
      setRestoreProgress(0);
    },
    onError: (error) => {
      toast({
        title: "Restore Failed",
        description: error.message,
        variant: "destructive",
      });
      setIsRestoring(false);
      setRestoreProgress(0);
    },
  });

  // Download backup mutation
  const downloadBackupMutation = useMutation({
    mutationFn: async (backupId: number) => {
      return await apiRequest("GET", `/api/system/backups/${backupId}/download`, {});
    },
    onSuccess: (data) => {
      toast({
        title: "Download Started",
        description: "Backup download has been initiated.",
      });
    },
    onError: (error) => {
      toast({
        title: "Download Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCreateBackup = async () => {
    setIsBackingUp(true);
    setBackupProgress(0);

    // Simulate progress during the API call
    const progressInterval = setInterval(() => {
      setBackupProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 200);

    createBackupMutation.mutate();
  };

  const handleRestoreBackup = async (backupId: number) => {
    setIsRestoring(true);
    setRestoreProgress(0);

    // Simulate progress during the API call
    const progressInterval = setInterval(() => {
      setRestoreProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 8;
      });
    }, 250);

    restoreBackupMutation.mutate(backupId);
  };

  const handleDownloadBackup = (backup: any) => {
    downloadBackupMutation.mutate(backup.id);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString() + " " + new Date(dateString).toLocaleTimeString();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button data-testid="button-backup-restore-trigger">
            <Database className="w-4 h-4 mr-2" />
            Backup & Restore
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-y-auto" data-testid="modal-backup-restore">
        <DialogHeader>
          <DialogTitle>Backup & Restore</DialogTitle>
          <DialogDescription>
            Create database backups and restore from previous backups to ensure data safety.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Download className="w-5 h-5" />
                  Create Backup
                </CardTitle>
                <CardDescription>
                  Create a complete backup of your database
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isBackingUp ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      Creating backup...
                    </div>
                    <Progress value={backupProgress} className="w-full" />
                    <div className="text-sm text-center">{backupProgress}%</div>
                  </div>
                ) : (
                  <Button 
                    onClick={handleCreateBackup}
                    className="w-full"
                    data-testid="button-create-backup"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Create New Backup
                  </Button>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Upload className="w-5 h-5" />
                  Upload Backup
                </CardTitle>
                <CardDescription>
                  Upload and restore from a backup file
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button 
                    variant="outline" 
                    className="w-full"
                    data-testid="button-upload-backup"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Choose Backup File
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    Supports .sql and .zip files
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Restore Progress */}
          {isRestoring && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Restoring database... {restoreProgress}%
                  </div>
                  <Progress value={restoreProgress} className="w-full" />
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Important Notes */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-1">
                <p><strong>Important:</strong> Restoring a backup will overwrite all current data.</p>
                <p>• Automatic backups are created daily at 2:30 AM</p>
                <p>• Manual backups can be created anytime</p>
                <p>• Backups are stored securely and retained for 30 days</p>
              </div>
            </AlertDescription>
          </Alert>

          {/* Backup History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Backup History
              </CardTitle>
              <CardDescription>
                Recent database backups available for restore
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {backupHistory.map((backup) => (
                  <div 
                    key={backup.id} 
                    className="flex items-center justify-between p-3 bg-muted rounded-lg"
                    data-testid={`backup-item-${backup.id}`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="font-medium">{backup.filename}</span>
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {formatDate(backup.date)} • {backup.size} • {backup.type}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownloadBackup(backup)}
                        data-testid={`button-download-${backup.id}`}
                      >
                        <Download className="w-4 h-4 mr-1" />
                        Download
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleRestoreBackup(backup.id)}
                        disabled={isRestoring || isBackingUp}
                        data-testid={`button-restore-${backup.id}`}
                      >
                        <Upload className="w-4 h-4 mr-1" />
                        Restore
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Backup Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">3</div>
                <div className="text-sm text-muted-foreground">Available Backups</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">2.4 MB</div>
                <div className="text-sm text-muted-foreground">Latest Backup Size</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-orange-600">24h</div>
                <div className="text-sm text-muted-foreground">Last Backup</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}