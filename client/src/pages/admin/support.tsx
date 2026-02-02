import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminLayout from "@/components/admin/admin-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  MessageSquare,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  Search,
  User,
  Mail,
  Trash2,
  ArrowLeft,
  Image,
  Loader2,
  Send,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

interface SupportTicketWithUser {
  id: string;
  ticketNumber: number;
  userId: string;
  subject: string;
  description: string;
  status: "open" | "in_progress" | "resolved" | "closed";
  priority: "low" | "medium" | "high" | "urgent";
  imageUrls: string[];
  adminResponse: string | null;
  adminImageUrls: string[];
  userHasUnread: boolean;
  adminHasUnread: boolean;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  } | null;
}

interface SupportMessage {
  id: string;
  ticketId: string;
  senderId: string;
  senderType: "user" | "admin";
  message: string;
  imageUrls: string[] | null;
  createdAt: string;
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case "open":
      return <Clock className="h-4 w-4 text-yellow-500" />;
    case "in_progress":
      return <AlertCircle className="h-4 w-4 text-blue-500" />;
    case "resolved":
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case "closed":
      return <XCircle className="h-4 w-4 text-gray-500" />;
    default:
      return <Clock className="h-4 w-4 text-gray-500" />;
  }
};

const getStatusBadgeColor = (status: string) => {
  switch (status) {
    case "open":
      return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
    case "in_progress":
      return "bg-blue-500/10 text-blue-500 border-blue-500/20";
    case "resolved":
      return "bg-green-500/10 text-green-500 border-green-500/20";
    case "closed":
      return "bg-gray-500/10 text-gray-500 border-gray-500/20";
    default:
      return "bg-gray-500/10 text-gray-500 border-gray-500/20";
  }
};

const getPriorityBadgeColor = (priority: string) => {
  switch (priority) {
    case "low":
      return "bg-gray-500/10 text-gray-500 border-gray-500/20";
    case "medium":
      return "bg-blue-500/10 text-blue-500 border-blue-500/20";
    case "high":
      return "bg-orange-500/10 text-orange-500 border-orange-500/20";
    case "urgent":
      return "bg-red-500/10 text-red-500 border-red-500/20";
    default:
      return "bg-gray-500/10 text-gray-500 border-gray-500/20";
  }
};

export default function AdminSupport() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [selectedTicket, setSelectedTicket] = useState<SupportTicketWithUser | null>(null);
  const [adminResponse, setAdminResponse] = useState("");
  const [newStatus, setNewStatus] = useState("");
  const [newPriority, setNewPriority] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [ticketToDelete, setTicketToDelete] = useState<string | null>(null);
  const [adminImages, setAdminImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // Add this effect at the top of your component after state declarations
useEffect(() => {
  const markAsRead = async () => {
    if (selectedTicket?.adminHasUnread) {
      try {
        await apiRequest(
          `/api/admin/support/tickets/${selectedTicket.id}/mark-as-read`,
          "PATCH",
          {}
        );
        
        // Update local cache
        queryClient.setQueryData<SupportTicketWithUser[]>(
          ["/api/admin/support/tickets"],
          (old) => old?.map(t => 
            t.id === selectedTicket.id ? { ...t, adminHasUnread: false } : t
          )
        );
        
        // Update selected ticket
        setSelectedTicket(prev => prev ? { ...prev, adminHasUnread: false } : null);
      } catch (error) {
        console.error("Failed to mark as read:", error);
      }
    }
  };

  if (selectedTicket) {
    markAsRead();
  }
}, [selectedTicket?.id]);

  const { data: tickets = [], isLoading } = useQuery<SupportTicketWithUser[]>({
    queryKey: ["/api/admin/support/tickets"],
  });

  const updateTicketMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await apiRequest(`/api/admin/support/tickets/${id}`, "PATCH", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Ticket Updated",
        description: "The support ticket has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/support/tickets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/support/unread-count"] });
      setSelectedTicket(null);
      setAdminResponse("");
      setNewStatus("");
      setNewPriority("");
      setAdminImages([]);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update ticket. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteTicketMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest(`/api/admin/support/tickets/${id}`, "DELETE");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Ticket Deleted",
        description: "The support ticket has been deleted.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/support/tickets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/support/unread-count"] });
      setDeleteDialogOpen(false);
      setTicketToDelete(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete ticket. Please try again.",
        variant: "destructive",
      });
    },
  });

  const { data: messages = [], isLoading: messagesLoading } = useQuery<SupportMessage[]>({
    queryKey: ["/api/admin/support/tickets", selectedTicket?.id, "messages"],
    enabled: !!selectedTicket,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (data: { message: string; imageUrls: string[] }) => {
      const response = await apiRequest(
        `/api/admin/support/tickets/${selectedTicket?.id}/messages`,
        "POST",
        data
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/support/tickets", selectedTicket?.id, "messages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/support/tickets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/support/unread-count"] });
      setAdminResponse("");
      setAdminImages([]);
      toast({
        title: "Message Sent",
        description: "Your reply has been sent to the user.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSendMessage = () => {
    if (!adminResponse.trim() && adminImages.length === 0) return;
    sendMessageMutation.mutate({
      message: adminResponse.trim(),
      imageUrls: adminImages,
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const formData = new FormData();
    Array.from(files).forEach((file) => {
      formData.append("images", file);
    });

    try {
      const response = await fetch("/api/support/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const data = await response.json();
      setAdminImages((prev) => [...prev, ...data.imageUrls]);
      toast({
        title: "Images Uploaded",
        description: `${data.imageUrls.length} image(s) uploaded successfully.`,
      });
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: "Failed to upload images. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  const removeAdminImage = (index: number) => {
    setAdminImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateTicket = () => {
    if (!selectedTicket) return;
    
    const data: any = {};
    if (adminResponse.trim()) {
      data.adminResponse = adminResponse.trim();
    }
    if (newStatus) {
      data.status = newStatus;
    }
    if (newPriority) {
      data.priority = newPriority;
    }
    if (adminImages.length > 0) {
      data.adminImageUrls = adminImages;
    }

    if (Object.keys(data).length === 0) {
      toast({
        title: "No Changes",
        description: "Please make at least one change before updating.",
        variant: "destructive",
      });
      return;
    }

    updateTicketMutation.mutate({ id: selectedTicket.id, data });
  };

  const handleDeleteClick = (id: string) => {
  setTicketToDelete(id);
  setDeleteDialogOpen(true);
};

 const confirmDelete = () => {
  if (ticketToDelete) {
    deleteTicketMutation.mutate(ticketToDelete);
  }
  setSelectedTicket(null);
  setDeleteDialogOpen(false);
};

  const filteredTickets = tickets.filter((ticket) => {
    const searchLower = searchQuery.toLowerCase();
    const ticketNumStr = ticket.ticketNumber?.toString() || "";
    const matchesSearch =
      searchQuery === "" ||
      ticketNumStr.includes(searchQuery) ||
      `#${ticketNumStr}`.includes(searchQuery) ||
      ticket.subject.toLowerCase().includes(searchLower) ||
      ticket.description.toLowerCase().includes(searchLower) ||
      ticket.user?.email.toLowerCase().includes(searchLower) ||
      ticket.user?.firstName?.toLowerCase().includes(searchLower) ||
      ticket.user?.lastName?.toLowerCase().includes(searchLower);

    const matchesStatus = statusFilter === "all" || ticket.status === statusFilter;
    const matchesPriority = priorityFilter === "all" || ticket.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  const stats = {
    total: tickets.length,
    open: tickets.filter((t) => t.status === "open").length,
    inProgress: tickets.filter((t) => t.status === "in_progress").length,
    resolved: tickets.filter((t) => t.status === "resolved").length,
    unread: tickets.filter((t) => t.adminHasUnread).length,
  };

  return (
    <AdminLayout>
  <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
    {/* HEADER */}
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div className="flex items-center gap-3">
        <MessageSquare className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-500 flex-shrink-0" />
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">Support Tickets</h1>
          <p className="text-gray-400 text-xs sm:text-sm">Manage user support requests</p>
        </div>
      </div>
    </div>

    {/* STATS CARDS */}
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
      <Card className="bg-[#2a2a2a] border-gray-700">
        <CardContent className="p-3 sm:p-4">
          <div className="text-lg sm:text-xl md:text-2xl font-bold text-white">{stats.total}</div>
          <p className="text-gray-400 text-xs sm:text-sm">Total</p>
        </CardContent>
      </Card>
      <Card className="bg-[#2a2a2a] border-gray-700">
        <CardContent className="p-3 sm:p-4">
          <div className="text-lg sm:text-xl md:text-2xl font-bold text-yellow-500">{stats.open}</div>
          <p className="text-gray-400 text-xs sm:text-sm">Open</p>
        </CardContent>
      </Card>
      <Card className="bg-[#2a2a2a] border-gray-700">
        <CardContent className="p-3 sm:p-4">
          <div className="text-lg sm:text-xl md:text-2xl font-bold text-blue-500">{stats.inProgress}</div>
          <p className="text-gray-400 text-xs sm:text-sm">In Progress</p>
        </CardContent>
      </Card>
      <Card className="bg-[#2a2a2a] border-gray-700">
        <CardContent className="p-3 sm:p-4">
          <div className="text-lg sm:text-xl md:text-2xl font-bold text-green-500">{stats.resolved}</div>
          <p className="text-gray-400 text-xs sm:text-sm">Resolved</p>
        </CardContent>
      </Card>
      <Card className="bg-[#2a2a2a] border-gray-700 col-span-2 md:col-span-1">
        <CardContent className="p-3 sm:p-4">
          <div className="text-lg sm:text-xl md:text-2xl font-bold text-red-500">{stats.unread}</div>
          <p className="text-gray-400 text-xs sm:text-sm">Unread</p>
        </CardContent>
      </Card>
    </div>

    {/* FILTERS */}
    <Card className="bg-[#2a2a2a] border-gray-700">
      <CardHeader className="p-4 sm:p-6">
        <CardTitle className="text-white text-lg sm:text-xl">Filters</CardTitle>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 pt-0">
        <div className="flex flex-col gap-4">
          {/* SEARCH */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by ticket #, subject, or user..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-[#1a1a1a] border-gray-600 text-white w-full"
              data-testid="input-search-tickets"
            />
          </div>
          
          {/* FILTERS ROW */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="bg-[#1a1a1a] border-gray-600 text-white w-full sm:w-[150px]" data-testid="select-status-filter">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="bg-[#2a2a2a] border-gray-600">
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="bg-[#1a1a1a] border-gray-600 text-white w-full sm:w-[150px]" data-testid="select-priority-filter">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent className="bg-[#2a2a2a] border-gray-600">
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>

    {/* LOADING / EMPTY STATE */}
    {isLoading ? (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-yellow-500" />
      </div>
    ) : filteredTickets.length === 0 ? (
      <Card className="bg-[#2a2a2a] border-gray-700">
        <CardContent className="flex flex-col items-center justify-center py-8 sm:py-12">
          <MessageSquare className="h-12 w-12 sm:h-16 sm:w-16 text-gray-500 mb-3 sm:mb-4" />
          <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">No Tickets Found</h3>
          <p className="text-gray-400 text-center text-sm sm:text-base">
            {searchQuery || statusFilter !== "all" || priorityFilter !== "all"
              ? "No tickets match your current filters."
              : "No support tickets have been submitted yet."}
          </p>
        </CardContent>
      </Card>
    ) : (
      <div className="space-y-3 sm:space-y-4">
        {filteredTickets.map((ticket) => (
          <Card
            key={ticket.id}
            className={`bg-[#2a2a2a] border-gray-700 cursor-pointer transition-all hover:border-yellow-500/50 ${
              ticket.adminHasUnread ? "border-l-4 border-l-red-500" : ""
            }`}
            onClick={() => {
              setSelectedTicket(ticket);
              setAdminResponse(ticket.adminResponse || "");
              setNewStatus(ticket.status);
              setNewPriority(ticket.priority);
            }}
            data-testid={`card-admin-ticket-${ticket.id}`}
          >
        <CardContent className="p-3 sm:p-4">
  <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3">
    <div className="min-w-0">
      {/* Header row */}
      <div className="flex items-center gap-2 mb-2">
        {ticket.adminHasUnread && (
          <span className="inline-flex items-center justify-center w-2 h-2 bg-red-500 rounded-full flex-shrink-0" />
        )}
        <div className="flex items-center gap-2 min-w-0">
          {ticket.ticketNumber && (
            <span className="text-yellow-500 font-mono text-xs sm:text-sm shrink-0">
              #{ticket.ticketNumber}
            </span>
          )}
          <h3 className="font-semibold text-white text-sm sm:text-base truncate">
            {ticket.subject}
          </h3>
        </div>
      </div>
      
      {/* Fixed height description */}
      <div className="h-[40px] mb-3">
        <p className="text-gray-400 text-xs sm:text-sm line-clamp-2 break-words">
          {ticket.description}
        </p>
      </div>
      
      {/* Metadata - always on one line */}
      <div className="flex items-center flex-wrap gap-2 sm:gap-4 text-xs sm:text-sm">
        <div className="flex items-center gap-1 text-gray-400 min-w-0">
          <User className="h-3 w-3 flex-shrink-0" />
          <span className="truncate max-w-[100px] sm:max-w-[120px]">
            {ticket.user
              ? `${ticket.user.firstName} ${ticket.user.lastName}`
              : "Unknown User"}
          </span>
        </div>
        <div className="flex items-center gap-1 text-gray-400 min-w-0">
          <Mail className="h-3 w-3 flex-shrink-0" />
          <span className="truncate max-w-[120px] sm:max-w-[150px]">
            {ticket.user?.email || "N/A"}
          </span>
        </div>
        <span className="text-gray-500 whitespace-nowrap">
          {format(new Date(ticket.createdAt), "MMM d")}
        </span>
      </div>
    </div>
    
    {/* Right column for badges */}
    <div className="flex flex-col items-start sm:items-end gap-2">
      {/* Same badges as before */}
    </div>
  </div>
</CardContent>
          </Card>
        ))}
      </div>
    )}

    {/* TICKET DETAIL DIALOG */}
    <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
      <DialogContent className="bg-[#2a2a2a] border-gray-700 text-white max-w-[95vw] sm:max-w-3xl max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-4 sm:p-6 flex-shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-yellow-500 text-lg sm:text-xl truncate">
                {selectedTicket?.ticketNumber ? `#${selectedTicket.ticketNumber} ` : ""}{selectedTicket?.subject}
              </DialogTitle>
              {selectedTicket?.user && (
                <DialogDescription className="text-gray-400 text-sm sm:text-base truncate">
                  From: {selectedTicket.user.firstName} {selectedTicket.user.lastName} ({selectedTicket.user.email})
                </DialogDescription>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger className="bg-[#1a1a1a] border-gray-600 text-white w-full sm:w-32 text-sm" data-testid="select-update-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#2a2a2a] border-gray-600">
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
              <Select value={newPriority} onValueChange={setNewPriority}>
                <SelectTrigger className="bg-[#1a1a1a] border-gray-600 text-white w-full sm:w-28 text-sm" data-testid="select-update-priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#2a2a2a] border-gray-600">
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </DialogHeader>

        {selectedTicket && (
          <div className="flex-1 overflow-y-auto space-y-4 p-4 sm:p-6 min-h-[200px]">
            {/* ORIGINAL MESSAGE */}
            <div className="flex justify-start">
              <div className="max-w-full sm:max-w-[80%] space-y-2">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                    <User className="h-3 w-3 sm:h-4 sm:w-4 text-blue-400" />
                  </div>
                  <span className="text-xs sm:text-sm text-blue-400 font-medium truncate">
                    {selectedTicket.user?.firstName} {selectedTicket.user?.lastName}
                  </span>
                </div>
                <div className="bg-blue-500/10 border border-blue-500/30 text-white p-3 sm:p-4 rounded-2xl rounded-bl-md ml-0 sm:ml-10">
                  <p className="whitespace-pre-wrap text-sm sm:text-base">{selectedTicket.description}</p>
                </div>
                {selectedTicket.imageUrls && selectedTicket.imageUrls.length > 0 && (
                  <div className="flex flex-wrap gap-2 ml-0 sm:ml-10">
                    {selectedTicket.imageUrls.map((url, index) => (
                      <a
                        key={index}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block w-12 h-12 sm:w-16 sm:h-16 rounded-lg overflow-hidden border border-blue-500/30 hover:border-blue-500 transition-colors"
                      >
                        <img
                          src={url}
                          alt={`Attachment ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </a>
                    ))}
                  </div>
                )}
                <p className="text-xs text-gray-500 ml-0 sm:ml-10">
                  {format(new Date(selectedTicket.createdAt), "PPp")}
                </p>
              </div>
            </div>

            {/* ADMIN RESPONSE */}
            {selectedTicket.adminResponse && (
              <div className="flex justify-end">
                <div className="max-w-full sm:max-w-[80%] space-y-2">
                  <div className="bg-yellow-500 text-black p-3 sm:p-4 rounded-2xl rounded-br-md">
                    <p className="whitespace-pre-wrap text-sm sm:text-base">{selectedTicket.adminResponse}</p>
                  </div>
                  {selectedTicket.adminImageUrls && selectedTicket.adminImageUrls.length > 0 && (
                    <div className="flex flex-wrap gap-2 justify-end">
                      {selectedTicket.adminImageUrls.map((url, index) => (
                        <a
                          key={index}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block w-12 h-12 sm:w-16 sm:h-16 rounded-lg overflow-hidden border border-yellow-500/50 hover:border-yellow-500 transition-colors"
                        >
                          <img
                            src={url}
                            alt={`Admin attachment ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </a>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-gray-500 text-right">
                    {format(new Date(selectedTicket.updatedAt), "PPp")}
                  </p>
                </div>
              </div>
            )}

            {/* ADDITIONAL MESSAGES */}
            {messagesLoading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-yellow-500" />
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.senderType === "admin" ? "justify-end" : "justify-start"}`}
                >
                  <div className="max-w-full sm:max-w-[80%] space-y-2">
                    {msg.senderType === "user" && (
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                          <User className="h-3 w-3 sm:h-4 sm:w-4 text-blue-400" />
                        </div>
                        <span className="text-xs sm:text-sm text-blue-400 font-medium truncate">
                          {selectedTicket.user?.firstName} {selectedTicket.user?.lastName}
                        </span>
                      </div>
                    )}
                    <div
                      className={`p-3 sm:p-4 rounded-2xl ${
                        msg.senderType === "admin"
                          ? "bg-yellow-500 text-black rounded-br-md"
                          : "bg-blue-500/10 border border-blue-500/30 text-white rounded-bl-md ml-0 sm:ml-10"
                      }`}
                    >
                      <p className="whitespace-pre-wrap text-sm sm:text-base">{msg.message}</p>
                    </div>
                    {msg.imageUrls && msg.imageUrls.length > 0 && (
                      <div className={`flex flex-wrap gap-2 ${msg.senderType === "admin" ? "justify-end" : "ml-0 sm:ml-10"}`}>
                        {msg.imageUrls.map((url, index) => (
                          <a
                            key={index}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`block w-12 h-12 sm:w-16 sm:h-16 rounded-lg overflow-hidden border ${
                              msg.senderType === "admin" ? "border-yellow-500/50 hover:border-yellow-500" : "border-blue-500/30 hover:border-blue-500"
                            } transition-colors`}
                          >
                            <img
                              src={url}
                              alt={`Attachment ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </a>
                        ))}
                      </div>
                    )}
                    <p className={`text-xs text-gray-500 ${msg.senderType === "admin" ? "text-right" : "ml-0 sm:ml-10"}`}>
                      {format(new Date(msg.createdAt), "PPp")}
                    </p>
                  </div>
                </div>
              ))
            )}

            {/* RESOLVED BADGE */}
            {selectedTicket.resolvedAt && (
              <div className="flex justify-center">
                <div className="bg-green-500/10 border border-green-500/30 text-green-400 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm">
                  Resolved on {format(new Date(selectedTicket.resolvedAt), "PPp")}
                </div>
              </div>
            )}
          </div>
        )}

        {/* RESPONSE INPUT AREA */}
        <div className="flex-shrink-0 border-t border-gray-700 p-4 sm:p-6 space-y-3">
          <div className="flex gap-2">
            <Textarea
              value={adminResponse}
              onChange={(e) => setAdminResponse(e.target.value)}
              placeholder="Type your response..."
              rows={2}
              className="flex-1 bg-[#1a1a1a] border-gray-600 text-white placeholder:text-gray-500 resize-none text-sm sm:text-base"
              data-testid="input-admin-response"
            />
            <div className="flex flex-col gap-2">
              <label className="cursor-pointer">
                <Input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  disabled={isUploading}
                  className="hidden"
                  data-testid="input-admin-images"
                />
                <div className="h-9 w-9 flex items-center justify-center bg-[#1a1a1a] border border-gray-600 rounded-md hover:bg-gray-700 transition-colors">
                  {isUploading ? (
                    <Loader2 className="h-4 w-4 animate-spin text-yellow-500" />
                  ) : (
                    <Image className="h-4 w-4 text-gray-400" />
                  )}
                </div>
              </label>
              <Button
                onClick={handleSendMessage}
                disabled={sendMessageMutation.isPending || (!adminResponse.trim() && adminImages.length === 0)}
                size="icon"
                className="bg-yellow-500 hover:bg-yellow-600 text-black h-9 w-9"
                data-testid="button-send-message"
              >
                {sendMessageMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
          {adminImages.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {adminImages.map((url, index) => (
                <div key={index} className="relative group">
                  <img
                    src={url}
                    alt={`Pending attachment ${index + 1}`}
                    className="w-10 h-10 sm:w-12 sm:h-12 object-cover rounded border border-gray-600"
                  />
                  <button
                    onClick={() => removeAdminImage(index)}
                    className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5"
                    type="button"
                  >
                    <XCircle className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* DIALOG FOOTER */}
        <DialogFooter className="flex flex-col sm:flex-row justify-between gap-3 p-4 sm:p-6 pt-0 border-t border-gray-700 flex-shrink-0">
          <Button
            variant="destructive"
            onClick={() => selectedTicket && handleDeleteClick(selectedTicket.id)}
            className="w-full sm:w-auto"
            data-testid="button-delete-ticket"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Ticket
          </Button>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              onClick={() => setSelectedTicket(null)}
              className="flex-1 sm:flex-none border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              Close
            </Button>
            <Button
              onClick={handleUpdateTicket}
              disabled={updateTicketMutation.isPending}
              className="flex-1 sm:flex-none bg-yellow-500 hover:bg-yellow-600 text-black font-semibold"
              data-testid="button-update-ticket"
            >
              {updateTicketMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Update
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* DELETE CONFIRMATION DIALOG */}
    <Dialog open={deleteDialogOpen} onOpenChange={(open) => {
      setDeleteDialogOpen(open);
      if (!open) {
        setTicketToDelete(null);
      }
    }}>
      <DialogContent className="bg-[#2a2a2a] border-gray-700 text-white max-w-[95vw] sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-red-500 text-lg sm:text-xl">Delete Ticket</DialogTitle>
          <DialogDescription className="text-gray-400 text-sm sm:text-base">
            Are you sure you want to delete this support ticket? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => setDeleteDialogOpen(false)}
            className="w-full sm:w-auto border-gray-600 text-gray-300 hover:bg-gray-700"
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={confirmDelete}
            disabled={deleteTicketMutation.isPending}
            className="w-full sm:w-auto"
            data-testid="button-confirm-delete"
          >
            {deleteTicketMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</AdminLayout>
  );
}