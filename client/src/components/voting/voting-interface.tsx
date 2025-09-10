import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Calendar, Users, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { PollWithOptions } from "@shared/schema";

interface VotingInterfaceProps {
  poll: PollWithOptions;
  onBack?: () => void;
}

export function VotingInterface({ poll, onBack }: VotingInterfaceProps) {
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const voteMutation = useMutation({
    mutationFn: async (optionId: string) => {
      return await apiRequest(`/api/polls/${poll.id}/vote`, {
        method: "POST",
        body: JSON.stringify({ optionId }),
      });
    },
    onSuccess: () => {
      toast({
        title: "Vote Cast Successfully",
        description: "Your vote has been recorded.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/polls"] });
      queryClient.invalidateQueries({ queryKey: ["/api/polls", poll.id] });
      onBack?.();
    },
    onError: (error) => {
      toast({
        title: "Failed to Cast Vote",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleVote = () => {
    if (selectedOptions.length === 0) {
      toast({
        title: "No Option Selected",
        description: "Please select an option before voting.",
        variant: "destructive",
      });
      return;
    }

    // For now, we only support single choice voting
    // In the future, we can extend this for multiple choice
    voteMutation.mutate(selectedOptions[0]);
  };

  const handleOptionChange = (optionId: string, checked: boolean) => {
    if (poll.pollType === "single_choice" || poll.pollType === "yes_no") {
      setSelectedOptions(checked ? [optionId] : []);
    } else if (poll.pollType === "multiple_choice") {
      setSelectedOptions(prev => 
        checked 
          ? [...prev, optionId]
          : prev.filter(id => id !== optionId)
      );
    }
  };

  const isActive = poll.status === "active";
  const hasEnded = new Date() > new Date(poll.endDate);
  const canVote = isActive && !hasEnded && !poll.hasVoted;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card data-testid={`voting-interface-${poll.id}`}>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-xl font-bold mb-2" data-testid={`voting-title-${poll.id}`}>
                {poll.title}
              </CardTitle>
              <CardDescription className="text-base" data-testid={`voting-description-${poll.id}`}>
                {poll.description}
              </CardDescription>
            </div>
            <Badge variant={poll.status === "active" ? "default" : "secondary"}>
              {poll.status.charAt(0).toUpperCase() + poll.status.slice(1)}
            </Badge>
          </div>

          <div className="flex items-center justify-between text-sm text-gray-500 mt-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span data-testid={`voting-end-date-${poll.id}`}>
                Ends: {format(new Date(poll.endDate), "MMM dd, yyyy HH:mm")}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span data-testid={`voting-vote-count-${poll.id}`}>
                {poll.voteCount} votes
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-sm mt-2">
            <Badge variant="outline" data-testid={`voting-type-${poll.id}`}>
              {poll.pollType.replace("_", " ").toUpperCase()}
            </Badge>
            {poll.isAnonymous && (
              <Badge variant="outline" data-testid={`voting-anonymous-${poll.id}`}>
                Anonymous Voting
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent>
          {poll.hasVoted ? (
            <div className="text-center py-8">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-green-700 mb-2" data-testid={`voting-completed-${poll.id}`}>
                Vote Recorded
              </h3>
              <p className="text-gray-600">
                Thank you for participating in this poll. Your vote has been recorded.
              </p>
            </div>
          ) : !canVote ? (
            <div className="text-center py-8">
              <div className="text-gray-500 mb-4">
                {hasEnded ? "This poll has ended" : "This poll is not currently active"}
              </div>
              <p className="text-gray-600">
                {hasEnded ? "Voting is no longer available." : "Please wait for the poll to become active."}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4" data-testid={`voting-options-title-${poll.id}`}>
                  Choose your option{poll.pollType === "multiple_choice" ? "s" : ""}:
                </h3>
                
                {poll.pollType === "single_choice" || poll.pollType === "yes_no" ? (
                  <RadioGroup
                    value={selectedOptions[0] || ""}
                    onValueChange={(value) => setSelectedOptions([value])}
                    className="space-y-3"
                    data-testid={`voting-radio-group-${poll.id}`}
                  >
                    {poll.options.map((option) => (
                      <div 
                        key={option.id} 
                        className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50"
                        data-testid={`voting-option-${option.id}`}
                      >
                        <RadioGroupItem 
                          value={option.id} 
                          id={option.id}
                          data-testid={`radio-option-${option.id}`}
                        />
                        <Label htmlFor={option.id} className="flex-1 cursor-pointer">
                          {option.optionText}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                ) : (
                  <div className="space-y-3" data-testid={`voting-checkbox-group-${poll.id}`}>
                    {poll.options.map((option) => (
                      <div 
                        key={option.id} 
                        className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50"
                        data-testid={`voting-option-${option.id}`}
                      >
                        <Checkbox
                          id={option.id}
                          checked={selectedOptions.includes(option.id)}
                          onCheckedChange={(checked) => 
                            handleOptionChange(option.id, checked as boolean)
                          }
                          data-testid={`checkbox-option-${option.id}`}
                        />
                        <Label htmlFor={option.id} className="flex-1 cursor-pointer">
                          {option.optionText}
                        </Label>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                {onBack && (
                  <Button 
                    variant="outline" 
                    onClick={onBack}
                    className="flex-1"
                    data-testid={`button-back-voting-${poll.id}`}
                  >
                    Back to Polls
                  </Button>
                )}
                <Button 
                  onClick={handleVote}
                  disabled={selectedOptions.length === 0 || voteMutation.isPending}
                  className="flex-1"
                  data-testid={`button-cast-vote-${poll.id}`}
                >
                  {voteMutation.isPending ? "Casting Vote..." : "Cast Vote"}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}