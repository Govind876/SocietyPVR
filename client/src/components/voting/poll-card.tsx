import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Calendar, Clock, Users, CheckCircle, XCircle } from "lucide-react";
import { format } from "date-fns";
import type { PollWithOptions } from "@shared/schema";

interface PollCardProps {
  poll: PollWithOptions;
  onVote?: (pollId: string) => void;
  onViewResults?: (pollId: string) => void;
  isAdmin?: boolean;
}

export function PollCard({ poll, onVote, onViewResults, isAdmin }: PollCardProps) {
  const isActive = poll.status === "active";
  const hasEnded = new Date() > new Date(poll.endDate);
  const canVote = isActive && !hasEnded && !poll.hasVoted;

  const getStatusColor = () => {
    switch (poll.status) {
      case "active":
        return hasEnded ? "destructive" : "default";
      case "closed":
        return "secondary";
      case "draft":
        return "outline";
      default:
        return "secondary";
    }
  };

  const getStatusText = () => {
    if (poll.status === "active" && hasEnded) return "Ended";
    return poll.status.charAt(0).toUpperCase() + poll.status.slice(1);
  };

  return (
    <Card className="w-full hover:shadow-lg transition-shadow duration-300" data-testid={`poll-card-${poll.id}`}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold mb-2" data-testid={`poll-title-${poll.id}`}>
              {poll.title}
            </CardTitle>
            <CardDescription className="text-sm text-gray-600" data-testid={`poll-description-${poll.id}`}>
              {poll.description}
            </CardDescription>
          </div>
          <Badge variant={getStatusColor()} data-testid={`poll-status-${poll.id}`}>
            {getStatusText()}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {/* Poll Info */}
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span data-testid={`poll-end-date-${poll.id}`}>
                Ends: {format(new Date(poll.endDate), "MMM dd, yyyy HH:mm")}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span data-testid={`poll-vote-count-${poll.id}`}>
                {poll.voteCount} votes
              </span>
            </div>
          </div>

          {/* Poll Type & Anonymous Info */}
          <div className="flex items-center gap-4 text-sm">
            <Badge variant="outline" data-testid={`poll-type-${poll.id}`}>
              {poll.pollType.replace("_", " ").toUpperCase()}
            </Badge>
            {poll.isAnonymous && (
              <Badge variant="outline" data-testid={`poll-anonymous-${poll.id}`}>
                Anonymous
              </Badge>
            )}
          </div>

          {/* Voting Status */}
          {poll.hasVoted && (
            <div className="flex items-center gap-2 text-green-600 bg-green-50 p-2 rounded-lg">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm font-medium" data-testid={`poll-voted-status-${poll.id}`}>
                You have voted
              </span>
            </div>
          )}

          {hasEnded && !poll.hasVoted && (
            <div className="flex items-center gap-2 text-red-600 bg-red-50 p-2 rounded-lg">
              <XCircle className="w-4 h-4" />
              <span className="text-sm font-medium" data-testid={`poll-missed-status-${poll.id}`}>
                Poll ended - You missed voting
              </span>
            </div>
          )}

          {!isActive && poll.status === "draft" && (
            <div className="flex items-center gap-2 text-gray-600 bg-gray-50 p-2 rounded-lg">
              <Clock className="w-4 h-4" />
              <span className="text-sm font-medium" data-testid={`poll-draft-status-${poll.id}`}>
                Draft - Not yet active
              </span>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="flex gap-2">
        {canVote && (
          <Button 
            onClick={() => onVote?.(poll.id)}
            className="flex-1"
            data-testid={`button-vote-${poll.id}`}
          >
            Vote Now
          </Button>
        )}
        
        <Button 
          variant="outline" 
          onClick={() => onViewResults?.(poll.id)}
          className={canVote ? "flex-1" : "w-full"}
          data-testid={`button-view-results-${poll.id}`}
        >
          View Results
        </Button>
      </CardFooter>
    </Card>
  );
}