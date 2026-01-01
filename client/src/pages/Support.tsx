import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { 
  MessageCircle, 
  Plus, 
  Send, 
  HelpCircle,
  ChevronLeft,
  Clock
} from "lucide-react";
import type { ApiUser } from "@/lib/api";

interface SupportTicket {
  id: number;
  userId: number;
  subject: string;
  category: string;
  priority: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface TicketMessage {
  id: number;
  ticketId: number;
  senderId: number;
  message: string;
  isAdminReply: boolean;
  createdAt: string;
  senderName: string;
  senderRole: string;
}

interface TicketDetails extends SupportTicket {
  messages: TicketMessage[];
  user?: {
    id: number;
    name: string;
    email: string;
  };
}

export default function Support() {
  const queryClient = useQueryClient();
  const [view, setView] = useState<"list" | "new" | "detail">("list");
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [category, setCategory] = useState("general");
  const [priority, setPriority] = useState("normal");
  const [replyText, setReplyText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: user } = useQuery<ApiUser>({
    queryKey: ["currentUser"],
  });

  const { data: tickets, isLoading: ticketsLoading } = useQuery<SupportTicket[]>({
    queryKey: [`/api/users/${user?.id}/support-tickets`],
    enabled: !!user?.id,
  });

  const { data: ticketDetails, isLoading: detailsLoading } = useQuery<TicketDetails>({
    queryKey: [`/api/support-tickets/${selectedTicketId}`],
    enabled: !!selectedTicketId,
  });

  const handleCreateTicket = async () => {
    if (!user?.id || !subject.trim() || !message.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/support-tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          subject,
          category,
          priority,
          message,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create ticket");
      }

      toast.success("Support ticket created successfully");
      setSubject("");
      setMessage("");
      setCategory("general");
      setPriority("normal");
      setView("list");
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user.id}/support-tickets`] });
    } catch (error) {
      toast.error("Failed to create ticket");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReply = async () => {
    if (!user?.id || !selectedTicketId || !replyText.trim()) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/support-tickets/${selectedTicketId}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          senderId: user.id,
          message: replyText,
          isAdminReply: false,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send reply");
      }

      toast.success("Reply sent");
      setReplyText("");
      queryClient.invalidateQueries({ queryKey: [`/api/support-tickets/${selectedTicketId}`] });
    } catch (error) {
      toast.error("Failed to send reply");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      open: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
      in_progress: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      resolved: "bg-green-500/20 text-green-400 border-green-500/30",
      closed: "bg-gray-500/20 text-gray-400 border-gray-500/30",
    };
    return variants[status] || variants.open;
  };

  const openTicket = (ticketId: number) => {
    setSelectedTicketId(ticketId);
    setView("detail");
  };

  if (view === "new") {
    return (
      <div className="min-h-screen bg-gray-900 p-4 lg:p-8">
        <div className="max-w-2xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => setView("list")}
            className="mb-6 text-gray-400"
            data-testid="button-back-to-list"
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back to Tickets
          </Button>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-purple-500" />
                Create Support Ticket
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-gray-300">Subject</Label>
                <Input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Brief description of your issue"
                  className="bg-gray-700 border-gray-600 text-white"
                  data-testid="input-ticket-subject"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-gray-300">Category</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="bg-gray-700 border-gray-600 text-white" data-testid="select-category">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="payment">Payment</SelectItem>
                      <SelectItem value="campaign">Campaign</SelectItem>
                      <SelectItem value="technical">Technical</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-300">Priority</Label>
                  <Select value={priority} onValueChange={setPriority}>
                    <SelectTrigger className="bg-gray-700 border-gray-600 text-white" data-testid="select-priority">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-gray-300">Message</Label>
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Describe your issue in detail..."
                  className="bg-gray-700 border-gray-600 text-white min-h-[150px]"
                  data-testid="input-ticket-message"
                />
              </div>

              <Button
                onClick={handleCreateTicket}
                disabled={isSubmitting || !subject.trim() || !message.trim()}
                className="w-full"
                data-testid="button-submit-ticket"
              >
                {isSubmitting ? "Submitting..." : "Submit Ticket"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (view === "detail" && selectedTicketId) {
    return (
      <div className="min-h-screen bg-gray-900 p-4 lg:p-8">
        <div className="max-w-3xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => {
              setView("list");
              setSelectedTicketId(null);
            }}
            className="mb-6 text-gray-400"
            data-testid="button-back-from-detail"
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back to Tickets
          </Button>

          {detailsLoading ? (
            <div className="text-center text-gray-400 py-8">Loading...</div>
          ) : ticketDetails ? (
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <CardTitle className="text-white">{ticketDetails.subject}</CardTitle>
                  <Badge className={getStatusBadge(ticketDetails.status)}>
                    {ticketDetails.status.replace("_", " ")}
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-2 text-sm text-gray-400">
                  <Badge variant="secondary">{ticketDetails.category}</Badge>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {new Date(ticketDetails.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-3">
                    {ticketDetails.messages?.map((msg) => (
                      <div
                        key={msg.id}
                        className={`p-4 rounded-lg ${
                          msg.isAdminReply
                            ? "bg-purple-500/20 ml-4"
                            : "bg-gray-700/50 mr-4"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-medium text-white text-sm">
                            {msg.isAdminReply ? "Support Team" : "You"}
                          </span>
                          {msg.isAdminReply && (
                            <Badge variant="secondary" className="text-xs">Admin</Badge>
                          )}
                        </div>
                        <p className="text-gray-300 whitespace-pre-wrap">{msg.message}</p>
                        <p className="text-xs text-gray-500 mt-2">
                          {new Date(msg.createdAt).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>

                {ticketDetails.status !== "closed" && (
                  <div className="flex gap-2">
                    <Textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Type your reply..."
                      className="bg-gray-700 border-gray-600 text-white flex-1"
                      data-testid="input-user-reply"
                    />
                    <Button
                      onClick={handleReply}
                      disabled={isSubmitting || !replyText.trim()}
                      data-testid="button-send-user-reply"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                )}

                {ticketDetails.status === "closed" && (
                  <div className="text-center text-gray-500 py-4">
                    This ticket is closed and cannot receive new replies.
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="text-center text-gray-400 py-8">Ticket not found</div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-4 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2">Help & Support</h1>
            <p className="text-gray-400">Get help with your account and campaigns</p>
          </div>
          <Button onClick={() => setView("new")} data-testid="button-new-ticket">
            <Plus className="h-4 w-4 mr-2" />
            New Ticket
          </Button>
        </div>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-purple-500" />
              Your Tickets
            </CardTitle>
          </CardHeader>
          <CardContent>
            {ticketsLoading ? (
              <div className="text-center text-gray-400 py-8">Loading tickets...</div>
            ) : tickets && tickets.length > 0 ? (
              <div className="space-y-3">
                {tickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className="bg-gray-700/50 rounded-lg p-4 cursor-pointer transition-colors hover:bg-gray-700"
                    onClick={() => openTicket(ticket.id)}
                    data-testid={`user-ticket-${ticket.id}`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                      <h4 className="font-medium text-white">{ticket.subject}</h4>
                      <Badge className={getStatusBadge(ticket.status)}>
                        {ticket.status.replace("_", " ")}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      <Badge variant="secondary">{ticket.category}</Badge>
                      <span className="text-gray-500">
                        {new Date(ticket.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <MessageCircle className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">No tickets yet</h3>
                <p className="text-gray-400 mb-4">Create a ticket to get help from our support team</p>
                <Button onClick={() => setView("new")} data-testid="button-create-first-ticket">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Ticket
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
