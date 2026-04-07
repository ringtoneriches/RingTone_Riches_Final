import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminLayout from "@/components/admin/admin-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, User, Mail, Phone, MapPin, ArrowLeft, MessageSquare, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLocation } from "wouter";

interface UserData {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  createdAt: string;
}

interface SupportTicket {
  id: string;
  ticketNumber: number;
  subject: string;
  description: string;
  status: "open" | "in_progress" | "resolved" | "closed";
  priority: "low" | "medium" | "high" | "urgent";
  createdAt: string;
  updatedAt: string;
}

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

const getStatusIcon = (status: string) => {
  switch (status) {
    case "open":
      return <Clock className="h-4 w-4" />;
    case "in_progress":
      return <AlertCircle className="h-4 w-4" />;
    case "resolved":
      return <CheckCircle className="h-4 w-4" />;
    case "closed":
      return <XCircle className="h-4 w-4" />;
    default:
      return <Clock className="h-4 w-4" />;
  }
};

export default function CustomerEditWithTicket() {
  const { userId } = useParams();
  const [, location] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [pendingTicketId, setPendingTicketId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
  });

  // Check for pending ticket from sessionStorage
  useEffect(() => {
    const storedTicketId = sessionStorage.getItem('pendingTicketToClose');
    if (storedTicketId) {
      setPendingTicketId(storedTicketId);
      // Don't remove immediately - we need it for the component
    }
  }, []);

  // Fetch user data
  const { data: user, isLoading: userLoading } = useQuery<UserData>({
    queryKey: ["/api/admin/users", userId],
    enabled: !!userId,
  });

  // Fetch pending ticket if exists
  const { data: pendingTicket, refetch: refetchTicket } = useQuery<SupportTicket>({
    queryKey: ["/api/admin/support/tickets", pendingTicketId],
    queryFn: async () => {
      const response = await apiRequest(`/api/admin/support/tickets/${pendingTicketId}`, "GET");
      return response.json();
    },
    enabled: !!pendingTicketId,
  });

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest(`/api/admin/users/${userId}`, "PATCH", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Customer Updated",
        description: "Customer information has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users", userId] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update customer. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Close ticket mutation
  const closeTicketMutation = useMutation({
    mutationFn: async (ticketId: string) => {
      const response = await apiRequest(`/api/admin/support/tickets/${ticketId}`, "PATCH", {
        status: "closed"
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Ticket Closed",
        description: "The support request has been closed successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/support/tickets", pendingTicketId] });
      setPendingTicketId(null);
      sessionStorage.removeItem('pendingTicketToClose');
      refetchTicket();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to close ticket. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Set form data when user loads
  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        phone: user.phone || "",
        address: user.address || "",
        city: user.city || "",
        state: user.state || "",
        zipCode: user.zipCode || "",
      });
    }
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveCustomer = () => {
    updateUserMutation.mutate(formData);
  };

  const handleCloseTicket = () => {
    if (pendingTicketId) {
      closeTicketMutation.mutate(pendingTicketId);
    }
  };

  const handleBackToSupport = () => {
    const returnPage = sessionStorage.getItem('returnToSupportPage');
    if (returnPage) {
      sessionStorage.removeItem('returnToSupportPage');
      location(returnPage);
    } else {
      location('/admin/support');
    }
  };

  if (userLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-yellow-500" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
        {/* Header with back button */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBackToSupport}
              className="text-gray-400 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Support
            </Button>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white">Edit Customer</h1>
              <p className="text-gray-400 text-xs sm:text-sm">Update customer information</p>
            </div>
          </div>
        </div>

        {/* Customer Profile Section */}
        <Card className="bg-[#2a2a2a] border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <User className="h-5 w-5 text-yellow-500" />
              Customer Profile
            </CardTitle>
            <CardDescription className="text-gray-400">
              Update the customer's personal information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-white">First Name</Label>
                <Input
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  className="bg-[#1a1a1a] border-gray-600 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-white">Last Name</Label>
                <Input
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  className="bg-[#1a1a1a] border-gray-600 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-white flex items-center gap-2">
                  <Mail className="h-3 w-3" />
                  Email
                </Label>
                <Input
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="bg-[#1a1a1a] border-gray-600 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-white flex items-center gap-2">
                  <Phone className="h-3 w-3" />
                  Phone
                </Label>
                <Input
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="bg-[#1a1a1a] border-gray-600 text-white"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label className="text-white flex items-center gap-2">
                  <MapPin className="h-3 w-3" />
                  Address
                </Label>
                <Input
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  className="bg-[#1a1a1a] border-gray-600 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-white">City</Label>
                <Input
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  className="bg-[#1a1a1a] border-gray-600 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-white">State</Label>
                <Input
                  name="state"
                  value={formData.state}
                  onChange={handleInputChange}
                  className="bg-[#1a1a1a] border-gray-600 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-white">ZIP Code</Label>
                <Input
                  name="zipCode"
                  value={formData.zipCode}
                  onChange={handleInputChange}
                  className="bg-[#1a1a1a] border-gray-600 text-white"
                />
              </div>
            </div>
            
            <div className="mt-6 flex justify-end">
              <Button
                onClick={handleSaveCustomer}
                disabled={updateUserMutation.isPending}
                className="bg-yellow-500 hover:bg-yellow-600 text-black"
              >
                {updateUserMutation.isPending && (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                )}
                Save Customer Changes
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Support Request Section - Shows underneath when there's a pending ticket */}
        {pendingTicketId && pendingTicket && (
          <Card className="bg-[#2a2a2a] border-yellow-500/30">
            <CardHeader>
              <CardTitle className="text-yellow-500 flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Related Support Request
              </CardTitle>
              <CardDescription className="text-gray-400">
                Complete the customer work above, then close this ticket
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-[#1a1a1a] rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <h3 className="text-white font-semibold">
                      #{pendingTicket.ticketNumber} - {pendingTicket.subject}
                    </h3>
                    <p className="text-gray-400 text-sm mt-1">
                      {pendingTicket.description}
                    </p>
                  </div>
                  <Badge className={getStatusBadgeColor(pendingTicket.status)}>
                    {getStatusIcon(pendingTicket.status)}
                    <span className="ml-1 capitalize">{pendingTicket.status}</span>
                  </Badge>
                </div>
                
                <div className="flex items-center gap-4 text-xs text-gray-500 pt-2 border-t border-gray-700">
                  <span>Created: {format(new Date(pendingTicket.createdAt), "MMM d, yyyy h:mm a")}</span>
                  <span>Priority: <span className="capitalize">{pendingTicket.priority}</span></span>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // Navigate to full ticket view
                      sessionStorage.setItem('returnToSupportPage', window.location.pathname);
                      location(`/admin/support?ticket=${pendingTicketId}`);
                    }}
                    className="border-gray-600 text-gray-300"
                  >
                    View Full Ticket
                  </Button>
                  <Button
                    onClick={handleCloseTicket}
                    disabled={closeTicketMutation.isPending}
                    className="bg-green-600 hover:bg-green-700 text-white"
                    size="sm"
                  >
                    {closeTicketMutation.isPending && (
                      <Loader2 className="h-3 w-3 animate-spin mr-2" />
                    )}
                    Close Ticket
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}