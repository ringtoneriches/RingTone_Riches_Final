import { useState } from "react";
import AdminLayout from "@/components/admin/admin-layout";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  Search, Trash2, Send, Eye, Calendar, ArrowBigLeft, ArrowBigRight, 
  Plus, Mail, Users, Filter, Clock, CheckCircle, XCircle, AlertCircle,
  Info, Award, Megaphone
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface PushMessage {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "promotion" | "system";
  targetType: "all" | "specific_users" | "by_filter";
  targetUserIds: string[] | null;
  targetFilter: any | null;
  sentCount: number;
  readCount: number;
  status: "draft" | "scheduled" | "sent" | "cancelled";
  sentAt: string | null;
  createdAt: string;
}

export default function AdminPushMessages() {
  const { toast } = useToast();
  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState<string | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<PushMessage | null>(null);
  const [viewDetailsOpen, setViewDetailsOpen] = useState(false);
  const [sendConfirmOpen, setSendConfirmOpen] = useState(false);
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const itemsPerPage = 20;

  // Form state
 const [form, setForm] = useState({
  title: "",
  message: "",
  type: "info" as "info" | "success" | "warning" | "promotion" | "system",
  targetType: "all" as "all" | "specific_users" | "by_filter",
  targetUserIds: [] as string[],
  targetFilter: {
    userType: "all" as "all" | "verified" | "unverified",
    searchTerm: "", // For searching by name/email
  },
  status: "draft" as "draft" | "scheduled" | "sent",
});

  // Fetch messages
  const { data: messages, isLoading } = useQuery<PushMessage[]>({
    queryKey: ["/api/admin/sms-messages"],
    queryFn: async () => {
      const res = await fetch("/api/admin/sms-messages", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch messages");
      return res.json();
    },
  });

  // Fetch users for selection
  const { data: users } = useQuery<any[]>({
    queryKey: ["/api/admin/users"],
    queryFn: async () => {
      const res = await fetch("/api/admin/users", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch users");
      return res.json();
    },
    enabled: form.targetType === "specific_users",
  });
  const filteredUsers = users?.filter((user) => {
    if (!userSearchTerm) return true;
    const searchLower = userSearchTerm.toLowerCase();
    return (
      user.email?.toLowerCase().includes(searchLower) ||
      user.firstName?.toLowerCase().includes(searchLower) ||
      user.lastName?.toLowerCase().includes(searchLower) ||
      `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchLower)
    );
  }) || [];

  // Filter messages
  const filteredMessages = messages?.filter((msg) => {
    if (!searchInput.trim()) return true;
    const searchLower = searchInput.toLowerCase();
    return (
      msg.title.toLowerCase().includes(searchLower) ||
      msg.message.toLowerCase().includes(searchLower)
    );
  }).filter((msg) => {
    if (statusFilter === "all") return true;
    return msg.status === statusFilter;
  }) || [];

  // Pagination
  const totalPages = Math.ceil(filteredMessages.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedMessages = filteredMessages.slice(startIndex, startIndex + itemsPerPage);

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: typeof form) => {
      return apiRequest("/api/admin/sms-messages", "POST", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/sms-messages"] });
      toast({
        title: "Message Created",
        description: "Your push message has been saved as draft.",
      });
      setCreateDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create message",
        variant: "destructive",
      });
    },
  });

  // Send mutation
  const sendMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest(`/api/admin/sms-messages/${id}/send`, "POST");
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/sms-messages"] });
      toast({
        title: "Message Sent! 🎉",
        description: data.message || "Message sent successfully",
      });
      setSendConfirmOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send message",
        variant: "destructive",
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest(`/api/admin/sms-messages/${id}`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/sms-messages"] });
      toast({
        title: "Message Deleted",
        description: "The push message has been deleted.",
      });
      setDeleteDialogOpen(false);
      setMessageToDelete(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete message",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setForm({
      title: "",
      message: "",
      type: "info",
      targetType: "all",
      targetUserIds: [],
      targetFilter: {
        userType: "all",
        searchTerm:""
      },
      status: "draft",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(form);
  };

  const handleSend = (id: string) => {
    setSelectedMessage(messages?.find(m => m.id === id) || null);
    setSendConfirmOpen(true);
  };

  const confirmSend = () => {
    if (selectedMessage) {
      sendMutation.mutate(selectedMessage.id);
    }
  };

  const handleDelete = (id: string) => {
    setMessageToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (messageToDelete) {
      deleteMutation.mutate(messageToDelete);
    }
  };

  const handleViewDetails = (message: PushMessage) => {
    setSelectedMessage(message);
    setViewDetailsOpen(true);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "info": return <Info className="w-4 h-4 text-blue-500" />;
      case "success": return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "warning": return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case "promotion": return <Award className="w-4 h-4 text-purple-500" />;
      case "system": return <Megaphone className="w-4 h-4 text-gray-500" />;
      default: return <Mail className="w-4 h-4" />;
    }
  };

  const getTypeBadge = (type: string) => {
    const colors = {
      info: "bg-blue-500/10 text-blue-500 border-blue-500/20",
      success: "bg-green-500/10 text-green-500 border-green-500/20",
      warning: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
      promotion: "bg-purple-500/10 text-purple-500 border-purple-500/20",
      system: "bg-gray-500/10 text-gray-500 border-gray-500/20",
    };
    return colors[type as keyof typeof colors] || colors.info;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "sent":
        return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Sent</Badge>;
      case "scheduled":
        return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">Scheduled</Badge>;
      case "draft":
        return <Badge variant="outline">Draft</Badge>;
      case "cancelled":
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-4 md:space-y-6 p-3 sm:p-4 md:p-6 max-w-full overflow-x-hidden">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">
              Push Messages
            </h1>
            <p className="text-xs sm:text-sm md:text-base text-muted-foreground mt-1">
              Send notifications to specific users
            </p>
          </div>
          
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-1 sm:gap-2 text-sm sm:text-base">
                <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                New Message
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
              <DialogHeader>
                <DialogTitle className="text-lg sm:text-xl">
                  Create Push Message
                </DialogTitle>
                <DialogDescription className="text-xs sm:text-sm">
                  Create a new notification to send to users
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
  {/* Title */}
  <div className="space-y-2">
    <Label htmlFor="title">Title *</Label>
    <Input
      id="title"
      value={form.title}
      onChange={(e) => setForm({ ...form, title: e.target.value })}
      placeholder="e.g., Special Offer Just for You!"
      required
    />
  </div>

  {/* Message */}
  <div className="space-y-2">
    <Label htmlFor="message">Message *</Label>
    <Textarea
      id="message"
      value={form.message}
      onChange={(e) => setForm({ ...form, message: e.target.value })}
      placeholder="Write your message here..."
      rows={4}
      required
    />
  </div>

  {/* Type and Status */}
  <div className="grid grid-cols-2 gap-4">
    <div className="space-y-2">
      <Label htmlFor="type">Type</Label>
      <Select
        value={form.type}
        onValueChange={(value: any) => setForm({ ...form, type: value })}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="info">Info</SelectItem>
          <SelectItem value="success">Success</SelectItem>
          <SelectItem value="warning">Warning</SelectItem>
          <SelectItem value="promotion">Promotion</SelectItem>
          <SelectItem value="system">System</SelectItem>
        </SelectContent>
      </Select>
    </div>

    <div className="space-y-2">
      <Label htmlFor="status">Status</Label>
      <Select
        value={form.status}
        onValueChange={(value: any) => setForm({ ...form, status: value })}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="draft">Draft</SelectItem>
          <SelectItem value="scheduled">Scheduled</SelectItem>
        </SelectContent>
      </Select>
    </div>
  </div>

  {/* Target Audience - UPDATED with name/email search */}
  <div className="space-y-3">
    <Label>Target Audience</Label>
    <Select
      value={form.targetType}
      onValueChange={(value: any) => setForm({ ...form, targetType: value })}
    >
      <SelectTrigger>
        <SelectValue placeholder="Select who to send to" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Users</SelectItem>
        <SelectItem value="specific_users">Select Specific Users</SelectItem>
      </SelectContent>
    </Select>

    {/* Specific Users Selection */}
    {form.targetType === "specific_users" && users && (
  <div className="border rounded-lg p-4 space-y-3">
    <Input
      placeholder="Search users by name or email..."
      value={userSearchTerm}
      onChange={(e) => setUserSearchTerm(e.target.value)}
      className="mb-2"
    />
    <div className="max-h-60 overflow-y-auto space-y-2">
      {filteredUsers.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          No users found matching "{userSearchTerm}"
        </p>
      ) : (
        filteredUsers.map((user) => (
          <div key={user.id} className="flex items-center space-x-2 p-2 hover:bg-muted/50 rounded">
            <Checkbox
              id={user.id}
              checked={form.targetUserIds.includes(user.id)}
              onCheckedChange={(checked) => {
                if (checked) {
                  setForm({
                    ...form,
                    targetUserIds: [...form.targetUserIds, user.id]
                  });
                } else {
                  setForm({
                    ...form,
                    targetUserIds: form.targetUserIds.filter(id => id !== user.id)
                  });
                }
              }}
            />
            <Label htmlFor={user.id} className="text-sm cursor-pointer flex-1">
              <div className="font-medium">{user.email}</div>
              <div className="text-xs text-muted-foreground">
                {user.firstName} {user.lastName} • {user.isVerified ? '✓ Verified' : '○ Unverified'}
              </div>
            </Label>
          </div>
        ))
      )}
    </div>
    {form.targetUserIds.length > 0 && (
      <div className="text-xs text-muted-foreground border-t pt-2">
        Selected {form.targetUserIds.length} user(s)
      </div>
    )}
  </div>
)}

    {/* Filter by Name/Email */}
    {form.targetType === "by_filter" && (
      <div className="border rounded-lg p-4 space-y-4">
        <div className="space-y-2">
          <Label>Search Users</Label>
          <Input
            placeholder="Enter name or email to filter..."
            value={form.targetFilter.searchTerm}
            onChange={(e) => 
              setForm({
                ...form,
                targetFilter: { ...form.targetFilter, searchTerm: e.target.value }
              })
            }
          />
          <p className="text-xs text-muted-foreground">
            Will send to all users matching this search
          </p>
        </div>

        <div className="space-y-2">
          <Label>User Type (Optional)</Label>
          <Select
            value={form.targetFilter.userType}
            onValueChange={(value: any) => 
              setForm({
                ...form,
                targetFilter: { ...form.targetFilter, userType: value }
              })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select user type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Users</SelectItem>
              <SelectItem value="verified">Verified Only</SelectItem>
              <SelectItem value="unverified">Unverified Only</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    )}
  </div>

  {/* Removed: actionUrl, actionText, imageUrl, expiresAt, scheduledFor */}

  {/* Submit Buttons */}
  <div className="flex justify-end gap-2 pt-4">
    <Button
      type="button"
      variant="outline"
      onClick={() => {
        setCreateDialogOpen(false);
        resetForm();
      }}
    >
      Cancel
    </Button>
    <Button
      type="submit"
      disabled={createMutation.isPending}
    >
      {createMutation.isPending ? "Creating..." : "Create Message"}
    </Button>
  </div>
</form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
          <Card className="p-3 sm:p-4">
            <CardHeader className="pb-1 sm:pb-2 p-0">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
                Total Messages
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 pt-2">
              <div className="text-lg sm:text-xl md:text-2xl font-bold">
                {messages?.length || 0}
              </div>
            </CardContent>
          </Card>
          
          <Card className="p-3 sm:p-4">
            <CardHeader className="pb-1 sm:pb-2 p-0">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
                Sent
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 pt-2">
              <div className="text-lg sm:text-xl md:text-2xl font-bold text-green-500">
                {messages?.filter(m => m.status === "sent").length || 0}
              </div>
            </CardContent>
          </Card>
          
          <Card className="p-3 sm:p-4">
            <CardHeader className="pb-1 sm:pb-2 p-0">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
                Scheduled
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 pt-2">
              <div className="text-lg sm:text-xl md:text-2xl font-bold text-blue-500">
                {messages?.filter(m => m.status === "scheduled").length || 0}
              </div>
            </CardContent>
          </Card>
          
          <Card className="p-3 sm:p-4">
            <CardHeader className="pb-1 sm:pb-2 p-0">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
                Drafts
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 pt-2">
              <div className="text-lg sm:text-xl md:text-2xl font-bold text-gray-500">
                {messages?.filter(m => m.status === "draft").length || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Messages</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="draft">Drafts</SelectItem>
            </SelectContent>
          </Select>

          <div className="relative flex-1">
            <Search className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4 sm:w-5 sm:h-5" />
            <Input
              placeholder="Search messages..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-8 sm:pl-10 text-sm sm:text-base"
            />
          </div>
        </div>

        {/* Messages List */}
        <div className="space-y-3">
          {paginatedMessages.map((message) => (
            <Card key={message.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="mt-1">
                      {getTypeIcon(message.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-base">
                          {message.title}
                        </h3>
                        {getStatusBadge(message.status)}
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getTypeBadge(message.type)}`}>
                          {message.type}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {message.message}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {message.sentCount || 0} recipients
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {message.readCount || 0} reads
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(message.createdAt), "dd MMM yyyy")}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 md:ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewDetails(message)}
                      className="gap-1"
                    >
                      <Eye className="w-4 h-4" />
                      <span className="hidden sm:inline">View</span>
                    </Button>
                    
                    {message.status === "draft" && (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleSend(message.id)}
                        className="gap-1 bg-green-600 hover:bg-green-700"
                        disabled={sendMutation.isPending}
                      >
                        <Send className="w-4 h-4" />
                        <span className="hidden sm:inline">Send</span>
                      </Button>
                    )}
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(message.id)}
                      className="gap-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span className="hidden sm:inline">Delete</span>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {paginatedMessages.length === 0 && (
            <Card className="p-8 text-center">
              <div className="flex flex-col items-center justify-center">
                <Mail className="w-12 h-12 text-muted-foreground mb-4" />
                <div className="text-base sm:text-lg font-medium">No messages found</div>
                <div className="text-xs sm:text-sm text-muted-foreground mt-1">
                  {searchInput ? "Try a different search term" : "Create your first push message"}
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Pagination */}
        {filteredMessages.length > 0 && (
          <>
            <div className="flex flex-col sm:flex-row justify-center items-center gap-3 sm:gap-4 my-4 sm:my-6">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => p - 1)}
                  disabled={currentPage === 1}
                  className="w-10 h-10 sm:w-auto sm:h-auto sm:px-4"
                >
                  <ArrowBigLeft className="w-4 h-4" />
                </Button>

                <div className="flex items-center gap-1 sm:gap-2">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    if (pageNum > totalPages) return null;
                    
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                        className="w-8 h-8 sm:w-10 sm:h-10"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => p + 1)}
                  disabled={currentPage === totalPages}
                  className="w-10 h-10 sm:w-auto sm:h-auto sm:px-4"
                >
                  <ArrowBigRight className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </div>
            </div>

            <p className="text-center text-xs sm:text-sm text-muted-foreground">
              Showing {paginatedMessages.length} of {filteredMessages.length} messages
            </p>
          </>
        )}

        {/* View Details Dialog */}
        <Dialog open={viewDetailsOpen} onOpenChange={setViewDetailsOpen}>
          <DialogContent className="max-w-[95vw] sm:max-w-2xl p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl">
                Message Details
              </DialogTitle>
            </DialogHeader>
            
            {selectedMessage && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  {getTypeIcon(selectedMessage.type)}
                  <h3 className="font-bold text-lg">{selectedMessage.title}</h3>
                  {getStatusBadge(selectedMessage.status)}
                </div>

                <div className="bg-muted/50 p-4 rounded-lg">
                  <p className="text-sm whitespace-pre-wrap">{selectedMessage.message}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">Type</Label>
                    <div className="text-sm capitalize">{selectedMessage.type}</div>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Target</Label>
                    <div className="text-sm capitalize">{selectedMessage.targetType.replace('_', ' ')}</div>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Created</Label>
                    <div className="text-sm">
                      {format(new Date(selectedMessage.createdAt), "dd MMM yyyy HH:mm")}
                    </div>
                  </div>
                  {selectedMessage.sentAt && (
                    <div>
                      <Label className="text-xs text-muted-foreground">Sent</Label>
                      <div className="text-sm">
                        {format(new Date(selectedMessage.sentAt), "dd MMM yyyy HH:mm")}
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Card className="p-3">
                    <div className="text-2xl font-bold text-green-500">
                      {selectedMessage.sentCount || 0}
                    </div>
                    <div className="text-xs text-muted-foreground">Recipients</div>
                  </Card>
                  <Card className="p-3">
                    <div className="text-2xl font-bold text-blue-500">
                      {selectedMessage.readCount || 0}
                    </div>
                    <div className="text-xs text-muted-foreground">Read</div>
                  </Card>
                </div>

                {selectedMessage.actionText && selectedMessage.actionUrl && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Action</Label>
                    <div className="text-sm">
                      {selectedMessage.actionText} → {selectedMessage.actionUrl}
                    </div>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Send Confirmation Dialog */}
        <AlertDialog open={sendConfirmOpen} onOpenChange={setSendConfirmOpen}>
          <AlertDialogContent className="max-w-[95vw] sm:max-w-md p-4 sm:p-6">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-lg sm:text-xl">Send Message</AlertDialogTitle>
              <AlertDialogDescription className="text-sm sm:text-base">
                Are you sure you want to send this message? This action cannot be undone.
                {selectedMessage && (
                  <div className="mt-2 p-2 bg-muted/50 rounded">
                    <strong>{selectedMessage.title}</strong>
                    <p className="text-xs mt-1">{selectedMessage.message.substring(0, 100)}...</p>
                  </div>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0">
              <AlertDialogCancel className="w-full sm:w-auto text-sm sm:text-base mt-0">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmSend}
                className="bg-green-600 hover:bg-green-700 text-white w-full sm:w-auto text-sm sm:text-base"
                disabled={sendMutation.isPending}
              >
                {sendMutation.isPending ? "Sending..." : "Send Now"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent className="max-w-[95vw] sm:max-w-md p-4 sm:p-6">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-lg sm:text-xl">Delete Message</AlertDialogTitle>
              <AlertDialogDescription className="text-sm sm:text-base">
                Are you sure you want to delete this message? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0">
              <AlertDialogCancel className="w-full sm:w-auto text-sm sm:text-base mt-0">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDelete}
                className="bg-red-600 hover:bg-red-700 text-white w-full sm:w-auto text-sm sm:text-base"
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? "Deleting..." : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
}