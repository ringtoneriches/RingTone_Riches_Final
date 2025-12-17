import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { Link, useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import {
  MessageSquare,
  Plus,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  Image,
  Upload,
  Loader2,
  ArrowLeft,
  Send,
} from "lucide-react";
import { format } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface SupportTicket {
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

export default function Support() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [replyMessage, setReplyMessage] = useState("");
  const [replyImages, setReplyImages] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const replyFileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const { data: tickets = [], isLoading: ticketsLoading } = useQuery<SupportTicket[]>({
    queryKey: ["/api/support/tickets"],
    enabled: isAuthenticated,
  });

  const createTicketMutation = useMutation({
    mutationFn: async (data: { subject: string; description: string; imageUrls: string[] }) => {
      const response = await apiRequest("/api/support/tickets", "POST", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/support/tickets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/support/unread-count"] });
      toast({
        title: "Ticket Created",
        description: "Your support ticket has been submitted successfully.",
      });
      setShowCreateDialog(false);
      setSubject("");
      setDescription("");
      setUploadedImages([]);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create ticket. Please try again.",
        variant: "destructive",
      });
    },
  });

  const { data: messages = [], isLoading: messagesLoading } = useQuery<SupportMessage[]>({
    queryKey: ["/api/support/tickets", selectedTicket?.id, "messages"],
    enabled: !!selectedTicket,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (data: { message: string; imageUrls: string[] }) => {
      const response = await apiRequest(
        `/api/support/tickets/${selectedTicket?.id}/messages`,
        "POST",
        data
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/support/tickets", selectedTicket?.id, "messages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/support/tickets"] });
      setReplyMessage("");
      setReplyImages([]);
      // Scroll to bottom after a short delay to ensure DOM is updated
      setTimeout(() => {
        if (messagesContainerRef.current) {
          messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
        }
      }, 100);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Auto-scroll to bottom when messages load or change
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages, selectedTicket]);

  const handleReplyImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

      if (!response.ok) throw new Error("Upload failed");

      const data = await response.json();
      setReplyImages((prev) => [...prev, ...data.imageUrls]);
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: "Failed to upload images. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      if (replyFileInputRef.current) {
        replyFileInputRef.current.value = "";
      }
    }
  };

  const handleSendReply = () => {
    if (!replyMessage.trim() && replyImages.length === 0) return;
    sendMessageMutation.mutate({
      message: replyMessage.trim(),
      imageUrls: replyImages,
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

      if (!response.ok) throw new Error("Upload failed");

      const data = await response.json();
      setUploadedImages((prev) => [...prev, ...data.imageUrls]);
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
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleSubmitTicket = () => {
    if (!subject.trim() || !description.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in both subject and description.",
        variant: "destructive",
      });
      return;
    }
    createTicketMutation.mutate({
      subject: subject.trim(),
      description: description.trim(),
      imageUrls: uploadedImages,
    });
  };

  const removeImage = (index: number) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== index));
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-yellow-500" />
      </div>
    );
  }

  if (!isAuthenticated) {
    navigate("/login");
    return null;
  }

  return (
    <div className="min-h-screen text-white">
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <MessageSquare className="h-8 w-8 text-yellow-500" />
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-yellow-500">Support</h1>
              <p className="text-gray-400 text-sm">Get help with your account</p>
            </div>
          </div>
          <Button
            onClick={() => setShowCreateDialog(true)}
            className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold"
            data-testid="button-create-ticket"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Ticket
          </Button>
        </div>

        {ticketsLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-yellow-500" />
          </div>
        ) : tickets.length === 0 ? (
          <Card className="bg-[#2a2a2a] border-gray-700">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <MessageSquare className="h-16 w-16 text-gray-500 mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No Support Tickets</h3>
              <p className="text-gray-400 text-center mb-6">
                Need help? Create a new support ticket and we'll get back to you as soon as possible.
              </p>
              <Button
                onClick={() => setShowCreateDialog(true)}
                className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold"
                data-testid="button-create-ticket-empty"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create First Ticket
              </Button>
            </CardContent>
          </Card>
        ) : selectedTicket ? (
          <div className="flex flex-col h-[calc(100vh-200px)]">
            <div className="flex items-center justify-between gap-4 mb-4 pb-4 border-b border-gray-700">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedTicket(null)}
                  className="text-gray-400 hover:text-white"
                  data-testid="button-back-to-list"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                  <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                    {selectedTicket.ticketNumber && (
                      <span className="text-yellow-500 font-mono">#{selectedTicket.ticketNumber}</span>
                    )}
                    {selectedTicket.subject}
                  </h2>
                  <p className="text-gray-400 text-sm">
                    Created {format(new Date(selectedTicket.createdAt), "PPp")}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className={`${getStatusBadgeColor(selectedTicket.status)} border`}>
                  {getStatusIcon(selectedTicket.status)}
                  <span className="ml-1 capitalize">{selectedTicket.status.replace("_", " ")}</span>
                </Badge>
                <Badge className={`${getPriorityBadgeColor(selectedTicket.priority)} border`}>
                  <span className="capitalize">{selectedTicket.priority}</span>
                </Badge>
              </div>
            </div>
            
            {/* Messages Container - Fixed scroll behavior */}
            <div 
              ref={messagesContainerRef}
              className="flex-1 overflow-y-auto space-y-4 pb-4"
              style={{ 
                display: 'flex', 
                flexDirection: 'column',
                justifyContent: 'flex-end',
                minHeight: 0
              }}
            >
              <div className="space-y-4">
                {/* Original Ticket */}
                <div className="flex justify-end">
                  <div className="max-w-[80%] space-y-2">
                    <div className="bg-yellow-500 text-black p-4 rounded-2xl rounded-br-md">
                      <p className="whitespace-pre-wrap ">{selectedTicket.description}</p>
                    </div>
                    {selectedTicket.imageUrls && selectedTicket.imageUrls.length > 0 && (
                      <div className="flex flex-wrap gap-2 justify-end">
                        {selectedTicket.imageUrls.map((url, index) => (
                          <a
                            key={index}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block w-20 h-20 rounded-lg overflow-hidden border border-yellow-500/50 hover:border-yellow-500 transition-colors"
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
                    <p className="text-xs text-gray-500 text-right">
                      {format(new Date(selectedTicket.createdAt), "p")}
                    </p>
                  </div>
                </div>

                {/* Admin Response */}
                {selectedTicket.adminResponse && (
                  <div className="flex justify-start">
                    <div className="max-w-[80%] space-y-2">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center">
                          <MessageSquare className="h-4 w-4 text-yellow-500" />
                        </div>
                        <span className="text-sm text-yellow-500 font-medium">Support Team</span>
                      </div>
                      <div className="bg-[#2a2a2a] border border-gray-700 text-white p-4 rounded-2xl rounded-bl-md ml-10">
                        <p className="whitespace-pre-wrap">{selectedTicket.adminResponse}</p>
                      </div>
                      {selectedTicket.adminImageUrls && selectedTicket.adminImageUrls.length > 0 && (
                        <div className="flex flex-wrap gap-2 ml-10">
                          {selectedTicket.adminImageUrls.map((url, index) => (
                            <a
                              key={index}
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block w-20 h-20 rounded-lg overflow-hidden border border-gray-600 hover:border-yellow-500 transition-colors"
                            >
                              <img
                                src={url}
                                alt={`Support attachment ${index + 1}`}
                                className="w-full h-full object-cover"
                              />
                            </a>
                          ))}
                        </div>
                      )}
                      <p className="text-xs text-gray-500 ml-10">
                        {format(new Date(selectedTicket.updatedAt), "p")}
                      </p>
                    </div>
                  </div>
                )}

                {/* Messages List */}
                {messagesLoading ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin text-yellow-500" />
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.senderType === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div className="max-w-[80%] space-y-2">
                        {msg.senderType === "admin" && (
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-yellow-500/20 flex items-center justify-center">
                              <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-500" />
                            </div>
                            <span className="text-xs sm:text-sm text-yellow-500 font-medium">Support Team</span>
                          </div>
                        )}
                        <div
                          className={`p-2 sm:p-4 rounded-md sm:rounded-2xl ${
                            msg.senderType === "user"
                              ? "bg-yellow-500 text-black rounded-br-md mr-1 text-sm sm:text-lg"
                              : "bg-[#2a2a2a] border border-gray-700 text-white rounded-bl-md ml-10 text-sm sm:text-lg"
                          }`}
                        >
                          <p className="whitespace-pre-wrap">{msg.message}</p>
                        </div>
                        {msg.imageUrls && msg.imageUrls.length > 0 && (
                          <div className={`flex flex-wrap gap-2 ${msg.senderType === "user" ? "justify-end" : "ml-10"}`}>
                            {msg.imageUrls.map((url, index) => (
                              <a
                                key={index}
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`block w-20 h-20 rounded-lg overflow-hidden border ${
                                  msg.senderType === "user" ? "border-yellow-500/50 hover:border-yellow-500" : "border-gray-600 hover:border-yellow-500"
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
                        <p className={`text-[10px] sm:text-xs text-gray-500 ${msg.senderType === "user" ? "text-right" : "ml-10"}`}>
                          {format(new Date(msg.createdAt), "p")}
                        </p>
                      </div>
                    </div>
                  ))
                )}

                {selectedTicket.resolvedAt && (
                  <div className="flex justify-center">
                    <div className="bg-green-500/10 border border-green-500/30 text-green-400 px-4 py-2 rounded-full text-sm">
                      Resolved on {format(new Date(selectedTicket.resolvedAt), "PPp")}
                    </div>
                  </div>
                )}

                {!selectedTicket.adminResponse && messages.length === 0 && selectedTicket.status === "open" && (
                  <div className="flex justify-center">
                    <div className="bg-gray-800 text-gray-400 px-4 py-2 rounded-full text-sm">
                      Waiting for support response...
                    </div>
                  </div>
                )}
              </div>
              <div ref={messagesEndRef} />
            </div>

            {selectedTicket.status !== "closed" && (
              <div className="border-t border-gray-700 pt-4 mt-4">
                <div className="bg-gradient-to-r from-yellow-500/10 via-yellow-500/5 to-transparent border border-yellow-500/30 rounded-xl p-4">
                  {replyImages.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {replyImages.map((url, index) => (
                        <div key={index} className="relative w-16 h-16">
                          <img
                            src={url}
                            alt={`Reply attachment ${index + 1}`}
                            className="w-full h-full object-cover rounded-lg border border-yellow-500/50"
                          />
                          <button
                            onClick={() => setReplyImages((prev) => prev.filter((_, i) => i !== index))}
                            className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs"
                            data-testid={`button-remove-reply-image-${index}`}
                          >
                            <XCircle className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex items-end gap-3">
                    <div className="flex-1">
                      <Textarea
                        value={replyMessage}
                        onChange={(e) => setReplyMessage(e.target.value)}
                        placeholder="Type your reply..."
                        rows={2}
                        className="bg-[#1a1a1a] text-sm sm:text-md border-gray-600 text-white placeholder:text-gray-500 placeholder:text-sm resize-none focus:border-yellow-500 focus:ring-yellow-500/20"
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleSendReply();
                          }
                        }}
                        data-testid="textarea-reply"
                      />
                    </div>
                    <div className="flex flex-col items-center sm:flex-row  gap-2">
                      <input
                        type="file"
                        ref={replyFileInputRef}
                        onChange={handleReplyImageUpload}
                        accept="image/*"
                        multiple
                        className="hidden"
                        data-testid="input-reply-images"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => replyFileInputRef.current?.click()}
                        disabled={isUploading}
                        className="border-gray-600 text-gray-300 hover:border-yellow-500 hover:text-yellow-500"
                        data-testid="button-attach-reply-image"
                      >
                        {isUploading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Image className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        onClick={handleSendReply}
                        disabled={(!replyMessage.trim() && replyImages.length === 0) || sendMessageMutation.isPending}
                        className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold"
                        data-testid="button-send-reply"
                      >
                        {sendMessageMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Press Enter to send, Shift+Enter for new line</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {tickets.map((ticket) => (
              <Card
                key={ticket.id}
                className={`bg-[#2a2a2a] border-gray-700 cursor-pointer transition-all hover:border-yellow-500/50 ${
                  ticket.userHasUnread ? "border-l-4 border-l-yellow-500" : ""
                }`}
                onClick={() => setSelectedTicket(ticket)}
                data-testid={`card-ticket-${ticket.id}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {ticket.userHasUnread && (
                          <span className="inline-flex items-center justify-center w-2 h-2 bg-yellow-500 rounded-full" />
                        )}
                        {ticket.ticketNumber && (
                          <span className="text-yellow-500 font-mono text-sm">#{ticket.ticketNumber}</span>
                        )}
                        <h3 className="font-semibold text-white truncate">{ticket.subject}</h3>
                      </div>
                      <p className="text-gray-400 text-sm line-clamp-2 mb-2">
                        {ticket.description}
                      </p>
                      <p className="text-gray-500 text-xs">
                        {format(new Date(ticket.createdAt), "PP")}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge className={`${getStatusBadgeColor(ticket.status)} border text-xs`}>
                        <span className="capitalize">{ticket.status.replace("_", " ")}</span>
                      </Badge>
                      {ticket.adminResponse && (
                        <span className="text-xs text-yellow-500">Has reply</span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="bg-[#2a2a2a] border-gray-700 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-yellow-500">Create Support Ticket</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="subject" className="text-white">Subject</Label>
              <Input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Brief description of your issue"
                className="bg-[#1a1a1a] border-gray-600 text-white placeholder:text-gray-500"
                data-testid="input-ticket-subject"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description" className="text-white">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Please describe your issue in detail..."
                rows={5}
                className="bg-[#1a1a1a] border-gray-600 text-white placeholder:text-gray-500 resize-none"
                data-testid="input-ticket-description"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-white">Attachments (optional)</Label>
              <div className="flex items-center gap-2 flex-wrap">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  accept="image/*"
                  multiple
                  className="hidden"
                  data-testid="input-ticket-images"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  {isUploading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4 mr-2" />
                  )}
                  Upload Images
                </Button>
                <span className="text-gray-500 text-sm">Max 5 images</span>
              </div>
              
              {uploadedImages.length > 0 && (
                <div className="grid grid-cols-4 gap-2 mt-2">
                  {uploadedImages.map((url, index) => (
                    <div key={index} className="relative aspect-square">
                      <img
                        src={url}
                        alt={`Upload ${index + 1}`}
                        className="w-full h-full object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                        data-testid={`button-remove-image-${index}`}
                      >
                        X
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateDialog(false);
                setSubject("");
                setDescription("");
                setUploadedImages([]);
              }}
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitTicket}
              disabled={createTicketMutation.isPending}
              className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold"
              data-testid="button-submit-ticket"
            >
              {createTicketMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Submit Ticket
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}