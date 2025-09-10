import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Vote, BarChart3, Clock, CheckCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { PollCard } from "@/components/voting/poll-card";
import { VotingInterface } from "@/components/voting/voting-interface";
import { PollResults } from "@/components/voting/poll-results";
import { CreatePollForm } from "@/components/voting/create-poll-form";
import type { PollWithOptions } from "@shared/schema";

type ViewMode = "list" | "vote" | "results" | "create";

export default function Voting() {
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [selectedPollId, setSelectedPollId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  const { user } = useAuth();

  const { data: polls = [], isLoading, error } = useQuery<PollWithOptions[]>({
    queryKey: ["/api/polls"],
  });

  const handleVote = (pollId: string) => {
    setSelectedPollId(pollId);
    setViewMode("vote");
  };

  const handleViewResults = (pollId: string) => {
    setSelectedPollId(pollId);
    setViewMode("results");
  };

  const handleCreatePoll = () => {
    setViewMode("create");
  };

  const handleBack = () => {
    setViewMode("list");
    setSelectedPollId(null);
  };

  const isAdmin = user?.role === "admin" || user?.role === "super_admin";

  const filterPolls = (polls: PollWithOptions[], filter: string) => {
    switch (filter) {
      case "active":
        return polls.filter(poll => poll.status === "active" && new Date() <= new Date(poll.endDate));
      case "ended":
        return polls.filter(poll => poll.status === "closed" || new Date() > new Date(poll.endDate));
      case "voted":
        return polls.filter(poll => poll.hasVoted);
      case "pending":
        return polls.filter(poll => poll.status === "active" && !poll.hasVoted && new Date() <= new Date(poll.endDate));
      default:
        return polls;
    }
  };

  if (viewMode === "vote" && selectedPollId) {
    const selectedPoll = polls.find(poll => poll.id === selectedPollId);
    if (selectedPoll) {
      return <VotingInterface poll={selectedPoll} onBack={handleBack} />;
    }
  }

  if (viewMode === "results" && selectedPollId) {
    return <PollResults pollId={selectedPollId} onBack={handleBack} />;
  }

  if (viewMode === "create") {
    return <CreatePollForm onCancel={handleBack} onSuccess={handleBack} />;
  }

  const filteredPolls = filterPolls(polls, activeTab);
  const activePolls = polls.filter(poll => poll.status === "active" && new Date() <= new Date(poll.endDate));
  const pendingVotes = activePolls.filter(poll => !poll.hasVoted);
  const completedVotes = polls.filter(poll => poll.hasVoted);

  return (
    <div className="space-y-6" data-testid="voting-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900" data-testid="voting-title">
            Digital Voting
          </h1>
          <p className="text-gray-600 mt-1">
            Participate in society decisions and view voting results
          </p>
        </div>
        {isAdmin && (
          <Button onClick={handleCreatePoll} data-testid="button-create-poll">
            <Plus className="w-4 h-4 mr-2" />
            Create Poll
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600" data-testid="stat-active-polls-label">Active Polls</p>
                <p className="text-2xl font-bold text-green-600" data-testid="stat-active-polls-count">
                  {activePolls.length}
                </p>
              </div>
              <Vote className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600" data-testid="stat-pending-votes-label">Pending Votes</p>
                <p className="text-2xl font-bold text-orange-600" data-testid="stat-pending-votes-count">
                  {pendingVotes.length}
                </p>
              </div>
              <Clock className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600" data-testid="stat-completed-votes-label">Completed Votes</p>
                <p className="text-2xl font-bold text-blue-600" data-testid="stat-completed-votes-count">
                  {completedVotes.length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600" data-testid="stat-total-polls-label">Total Polls</p>
                <p className="text-2xl font-bold text-purple-600" data-testid="stat-total-polls-count">
                  {polls.length}
                </p>
              </div>
              <BarChart3 className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Polls List */}
      <Card>
        <CardContent className="p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-5" data-testid="voting-tabs">
              <TabsTrigger value="all" data-testid="tab-all-polls">
                All Polls
                <Badge variant="secondary" className="ml-2">
                  {polls.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="active" data-testid="tab-active-polls">
                Active
                <Badge variant="secondary" className="ml-2">
                  {activePolls.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="pending" data-testid="tab-pending-votes">
                Pending Votes
                <Badge variant="secondary" className="ml-2">
                  {pendingVotes.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="voted" data-testid="tab-voted-polls">
                Voted
                <Badge variant="secondary" className="ml-2">
                  {completedVotes.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="ended" data-testid="tab-ended-polls">
                Ended
                <Badge variant="secondary" className="ml-2">
                  {filterPolls(polls, "ended").length}
                </Badge>
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-6">
              {isLoading ? (
                <div className="text-center py-8" data-testid="voting-loading">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-4 text-gray-600">Loading polls...</p>
                </div>
              ) : error ? (
                <div className="text-center py-8 text-red-600" data-testid="voting-error">
                  Failed to load polls. Please try again.
                </div>
              ) : filteredPolls.length === 0 ? (
                <div className="text-center py-8" data-testid="voting-empty">
                  <Vote className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No polls found</h3>
                  <p className="text-gray-600">
                    {activeTab === "all" 
                      ? "No polls have been created yet." 
                      : `No ${activeTab} polls available.`}
                  </p>
                  {isAdmin && activeTab === "all" && (
                    <Button onClick={handleCreatePoll} className="mt-4">
                      <Plus className="w-4 h-4 mr-2" />
                      Create First Poll
                    </Button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="polls-grid">
                  {filteredPolls.map((poll) => (
                    <PollCard
                      key={poll.id}
                      poll={poll}
                      onVote={handleVote}
                      onViewResults={handleViewResults}
                      isAdmin={isAdmin}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}