import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Calendar, Users, Award, BarChart3 } from "lucide-react";
import { format } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import type { PollWithOptions } from "@shared/schema";

interface PollResultsProps {
  pollId: string;
  onBack?: () => void;
}

interface PollResult {
  optionId: string;
  optionText: string;
  voteCount: number;
}

interface PollResultsData {
  poll: PollWithOptions;
  results: PollResult[];
}

export function PollResults({ pollId, onBack }: PollResultsProps) {
  const { data, isLoading, error } = useQuery<PollResultsData>({
    queryKey: ["/api/polls", pollId, "results"],
  });

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading poll results...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-red-600">Failed to load poll results</p>
            {onBack && (
              <Button onClick={onBack} className="mt-4">
                Back to Polls
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  const { poll, results } = data;
  const totalVotes = results.reduce((sum, result) => sum + result.voteCount, 0);
  const winningResult = results.reduce((max, result) => 
    result.voteCount > max.voteCount ? result : max, 
    results[0]
  );

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card data-testid={`poll-results-${poll.id}`}>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-xl font-bold mb-2" data-testid={`results-title-${poll.id}`}>
                {poll.title}
              </CardTitle>
              <CardDescription className="text-base" data-testid={`results-description-${poll.id}`}>
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
              <span data-testid={`results-end-date-${poll.id}`}>
                Ends: {format(new Date(poll.endDate), "MMM dd, yyyy HH:mm")}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span data-testid={`results-total-votes-${poll.id}`}>
                {totalVotes} total votes
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-sm mt-2">
            <Badge variant="outline" data-testid={`results-type-${poll.id}`}>
              {poll.pollType.replace("_", " ").toUpperCase()}
            </Badge>
            {poll.isAnonymous && (
              <Badge variant="outline" data-testid={`results-anonymous-${poll.id}`}>
                Anonymous Voting
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent>
          <div className="space-y-6">
            {/* Results Summary */}
            {totalVotes > 0 && (
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <div className="flex items-center gap-2 mb-2">
                  <Award className="w-5 h-5 text-green-600" />
                  <h3 className="font-semibold text-green-800" data-testid={`results-winner-title-${poll.id}`}>
                    Leading Option
                  </h3>
                </div>
                <p className="text-green-700 font-medium" data-testid={`results-winner-text-${poll.id}`}>
                  "{winningResult.optionText}" with {winningResult.voteCount} votes 
                  ({totalVotes > 0 ? Math.round((winningResult.voteCount / totalVotes) * 100) : 0}%)
                </p>
              </div>
            )}

            {/* Detailed Results */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="w-5 h-5 text-gray-600" />
                <h3 className="text-lg font-semibold" data-testid={`results-breakdown-title-${poll.id}`}>
                  Vote Breakdown
                </h3>
              </div>

              {totalVotes === 0 ? (
                <div className="text-center py-8 text-gray-500" data-testid={`results-no-votes-${poll.id}`}>
                  <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No votes cast yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {results.map((result, index) => {
                    const percentage = totalVotes > 0 ? (result.voteCount / totalVotes) * 100 : 0;
                    const isWinner = result.optionId === winningResult.optionId && result.voteCount > 0;
                    
                    return (
                      <div 
                        key={result.optionId} 
                        className={`p-4 border rounded-lg ${isWinner ? 'border-green-200 bg-green-50' : 'border-gray-200'}`}
                        data-testid={`result-option-${result.optionId}`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-medium" data-testid={`result-option-text-${result.optionId}`}>
                              {result.optionText}
                            </span>
                            {isWinner && (
                              <Award className="w-4 h-4 text-green-600" />
                            )}
                          </div>
                          <div className="text-sm text-gray-600" data-testid={`result-option-stats-${result.optionId}`}>
                            {result.voteCount} votes ({Math.round(percentage)}%)
                          </div>
                        </div>
                        <Progress 
                          value={percentage} 
                          className="h-2"
                          data-testid={`result-option-progress-${result.optionId}`}
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Actions */}
            {onBack && (
              <div className="flex justify-center">
                <Button 
                  onClick={onBack}
                  variant="outline"
                  className="w-full"
                  data-testid={`button-back-results-${poll.id}`}
                >
                  Back to Polls
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}