import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import AdminLayout from "@/components/admin/admin-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Mail, Users, Send, TrendingUp, Plus, Trash2, Eye, ArrowBigLeft, ArrowBigRight, Download } from "lucide-react";
import { format } from "date-fns";

interface User {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phoneNumber: string;
  createdAt: string;
}

interface Campaign {
  id: string;
  title: string;
  subject: string;
  message: string;
  offerType: string;
  discountCode: string | null;
  discountPercentage: number | null;
  bonusAmount: string | null;
  bonusPoints: number | null;
  expiryDate: string | null;
  status: string;
  recipientCount: number;
  sentAt: string | null;
  createdAt: string;
}

interface MarketingStats {
  totalSubscribers: number;
  totalCampaigns: number;
  sentCampaigns: number;
  draftCampaigns: number;
}

// Campaign validation schema
const campaignFormSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title is too long"),
  subject: z.string().min(1, "Subject is required").max(200, "Subject is too long"),
  message: z.string().min(1, "Message is required"),
  offerType: z.enum(["discount", "bonus", "announcement", "custom"]),
  discountCode: z.string().optional(),
  discountPercentage: z.string().optional(),
  bonusAmount: z.string().optional(),
  bonusPoints: z.string().optional(),
  expiryDate: z.string().optional(),
});

type CampaignFormData = z.infer<typeof campaignFormSchema>;

// Function to convert data to CSV format
const convertToCSV = (data: any[], headers: string[]): string => {
  // Create header row
  const headerRow = headers.join(",");
  
  // Create data rows
  const dataRows = data.map(item => {
    const row = headers.map(header => {
      let value = "";
      
      switch (header) {
        case "Name":
          const firstName = item.firstName || "";
          const lastName = item.lastName || "";
          value = `${firstName} ${lastName}`.trim();
          break;
        case "Email":
          value = item.email || "";
          break;
        case "Phone":
          value = item.phoneNumber || "";
          break;
        case "Subscribed Date":
          value = item.createdAt ? format(new Date(item.createdAt), "yyyy-MM-dd HH:mm:ss") : "";
          break;
      }
      
      // Escape commas and quotes for CSV
      if (value.includes(",") || value.includes('"') || value.includes("\n")) {
        value = `"${value.replace(/"/g, '""')}"`;
      }
      
      return value;
    });
    
    return row.join(",");
  });
  
  return [headerRow, ...dataRows].join("\n");
};

// Function to download CSV file
const downloadCSV = (csvContent: string, filename: string) => {
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export default function AdminMarketing() {
  const { toast } = useToast();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [viewCampaign, setViewCampaign] = useState<Campaign | null>(null);
  const [sendConfirmId, setSendConfirmId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  const form = useForm<CampaignFormData>({
    resolver: zodResolver(campaignFormSchema),
    defaultValues: {
      title: "",
      subject: "",
      message: "",
      offerType: "announcement",
      discountCode: "",
      discountPercentage: "",
      bonusAmount: "",
      bonusPoints: "",
      expiryDate: "",
    },
  });

  const { data: stats } = useQuery<MarketingStats>({
    queryKey: ["/api/admin/marketing/stats"],
  });

  const { data: subscribers = [] } = useQuery<User[]>({
    queryKey: ["/api/admin/marketing/subscribers"],
  });

  const { data: campaigns = [] } = useQuery<Campaign[]>({
    queryKey: ["/api/admin/marketing/campaigns"],
  });

  const createCampaignMutation = useMutation({
    mutationFn: async (data: CampaignFormData) => {
      const payload: any = {
        title: data.title,
        subject: data.subject,
        message: data.message,
        offerType: data.offerType,
      };

      if (data.offerType === "discount") {
        payload.discountCode = data.discountCode || null;
        payload.discountPercentage = data.discountPercentage ? parseInt(data.discountPercentage) : null;
      }

      if (data.offerType === "bonus") {
        payload.bonusAmount = data.bonusAmount || null;
        payload.bonusPoints = data.bonusPoints ? parseInt(data.bonusPoints) : null;
      }

      if (data.expiryDate) {
        payload.expiryDate = new Date(data.expiryDate).toISOString();
      }

      const res = await apiRequest("/api/admin/marketing/campaigns", "POST", payload);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/marketing/campaigns"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/marketing/stats"] });
      setCreateDialogOpen(false);
      form.reset();
      toast({ title: "Campaign created successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create campaign",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const sendCampaignMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest(`/api/admin/marketing/campaigns/${id}/send`, "POST", {});
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/marketing/campaigns"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/marketing/stats"] });
      setSendConfirmId(null);
      toast({
        title: "Campaign sent successfully!",
        description: `Sent to ${data.sentCount} subscribers. ${data.failedCount > 0 ? `${data.failedCount} failed.` : ''}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to send campaign",
        description: error.message,
        variant: "destructive",
      });
      setSendConfirmId(null);
    },
  });

  const deleteCampaignMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest(`/api/admin/marketing/campaigns/${id}`, "DELETE", {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/marketing/campaigns"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/marketing/stats"] });
      toast({ title: "Campaign deleted successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to delete campaign",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCreateCampaign = (data: CampaignFormData) => {
    createCampaignMutation.mutate(data);
  };

  const handleDownloadCSV = () => {
    if (!subscribers || subscribers.length === 0) {
      toast({
        title: "No data to export",
        description: "There are no subscribers to download.",
        variant: "destructive",
      });
      return;
    }

    try {
      const headers = ["Name", "Email", "Phone", "Subscribed Date"];
      const csvContent = convertToCSV(subscribers, headers);
      const filename = `subscribers_${format(new Date(), "yyyy-MM-dd_HH-mm")}.csv`;
      
      downloadCSV(csvContent, filename);
      
      toast({
        title: "CSV downloaded successfully",
        description: `${subscribers.length} subscribers exported to ${filename}`,
      });
    } catch (error) {
      toast({
        title: "Failed to download CSV",
        description: "An error occurred while generating the CSV file.",
        variant: "destructive",
      });
    }
  };

  const totalPages = Math.ceil(subscribers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedSubscribers = subscribers.slice(startIndex, startIndex + itemsPerPage);

  return (
    <AdminLayout>
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-4 md:p-6 max-w-full overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-yellow-400">Marketing</h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            Manage newsletter subscribers and promotional campaigns
          </p>
        </div>
        <Button
          onClick={() => setCreateDialogOpen(true)}
          className="bg-yellow-400 hover:bg-yellow-500 text-black w-full sm:w-auto text-sm sm:text-base py-2 sm:py-2.5"
          data-testid="button-create-campaign"
        >
          <Plus className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
          New Campaign
        </Button>
      </div>
  
      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
        <Card className="bg-zinc-900 border-zinc-800 p-3 sm:p-4">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-0">
            <CardTitle className="text-xs sm:text-sm font-medium text-gray-400">Total Subscribers</CardTitle>
            <Users className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-400" />
          </CardHeader>
          <CardContent className="p-0 pt-2">
            <div className="text-lg sm:text-xl md:text-2xl font-bold text-white" data-testid="text-total-subscribers">
              {stats?.totalSubscribers || 0}
            </div>
          </CardContent>
        </Card>
  
        <Card className="bg-zinc-900 border-zinc-800 p-3 sm:p-4">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-0">
            <CardTitle className="text-xs sm:text-sm font-medium text-gray-400">Total Campaigns</CardTitle>
            <Mail className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-400" />
          </CardHeader>
          <CardContent className="p-0 pt-2">
            <div className="text-lg sm:text-xl md:text-2xl font-bold text-white" data-testid="text-total-campaigns">
              {stats?.totalCampaigns || 0}
            </div>
          </CardContent>
        </Card>
  
        <Card className="bg-zinc-900 border-zinc-800 p-3 sm:p-4">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-0">
            <CardTitle className="text-xs sm:text-sm font-medium text-gray-400">Sent Campaigns</CardTitle>
            <Send className="h-3 w-3 sm:h-4 sm:w-4 text-green-400" />
          </CardHeader>
          <CardContent className="p-0 pt-2">
            <div className="text-lg sm:text-xl md:text-2xl font-bold text-white" data-testid="text-sent-campaigns">
              {stats?.sentCampaigns || 0}
            </div>
          </CardContent>
        </Card>
  
        <Card className="bg-zinc-900 border-zinc-800 p-3 sm:p-4">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-0">
            <CardTitle className="text-xs sm:text-sm font-medium text-gray-400">Draft Campaigns</CardTitle>
            <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-blue-400" />
          </CardHeader>
          <CardContent className="p-0 pt-2">
            <div className="text-lg sm:text-xl md:text-2xl font-bold text-white" data-testid="text-draft-campaigns">
              {stats?.draftCampaigns || 0}
            </div>
          </CardContent>
        </Card>
      </div>
  
      {/* Newsletter Subscribers - Mobile View */}
      <div className="block md:hidden">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="flex flex-row items-start justify-between p-4">
            <div>
              <CardTitle className="text-white text-base sm:text-lg">Newsletter Subscribers</CardTitle>
              <CardDescription className="text-gray-400 text-xs sm:text-sm">
                List of all newsletter subscribers
              </CardDescription>
            </div>
            <Button
              onClick={handleDownloadCSV}
              variant="outline"
              size="sm"
              className="border-green-600 text-green-400 hover:bg-green-600 hover:text-white text-xs"
              data-testid="button-download-csv"
            >
              <Download className="mr-1 h-3 w-3 sm:h-4 sm:w-4" />
              CSV
            </Button>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="space-y-3">
              {paginatedSubscribers.length === 0 ? (
                <div className="text-center text-gray-500 py-6 text-sm">
                  No subscribers yet
                </div>
              ) : (
                paginatedSubscribers.map((subscriber) => (
                  <div key={subscriber.id} className="border-b border-zinc-800 pb-3 last:border-0">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="text-white font-medium text-sm">
                          {subscriber.firstName && subscriber.lastName
                            ? `${subscriber.firstName} ${subscriber.lastName}`
                            : subscriber.firstName || subscriber.lastName || "-"}
                        </div>
                        <div className="text-yellow-400 text-xs mt-1">{subscriber.email}</div>
                      </div>
                      <div className="text-xs text-gray-400">
                        {format(new Date(subscriber.createdAt), "dd MMM")}
                      </div>
                    </div>
                    {subscriber.phoneNumber && (
                      <div className="text-gray-400 text-xs">
                        📱 {subscriber.phoneNumber}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
  
      {/* Newsletter Subscribers - Desktop View */}
      <div className="hidden md:block bg-zinc-900 border-zinc-800 rounded-lg overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-zinc-800 flex justify-between items-center">
          <div>
            <h3 className="text-white font-semibold text-lg">Newsletter Subscribers</h3>
            <p className="text-gray-400 text-sm">
              List of all users who subscribed to your newsletter
            </p>
          </div>
          <Button
            onClick={handleDownloadCSV}
            variant="outline"
            className="border-green-600 text-green-400 hover:bg-green-600 hover:text-white text-sm"
            data-testid="button-download-csv"
          >
            <Download className="mr-2 h-4 w-4" />
            Download CSV
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="text-left py-3 px-4 text-xs sm:text-sm font-medium text-gray-400">Name</th>
                <th className="text-left py-3 px-4 text-xs sm:text-sm font-medium text-gray-400">Email</th>
                <th className="text-left py-3 px-4 text-xs sm:text-sm font-medium text-gray-400">Phone</th>
                <th className="text-left py-3 px-4 text-xs sm:text-sm font-medium text-gray-400">Subscribed Date</th>
              </tr>
            </thead>
            <tbody>
              {paginatedSubscribers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center text-gray-500 py-8 text-sm">
                    No subscribers yet
                  </td>
                </tr>
              ) : (
                paginatedSubscribers.map((subscriber) => (
                  <tr key={subscriber.id} className="border-b border-zinc-800 hover:bg-zinc-800/50" data-testid={`row-subscriber-${subscriber.id}`}>
                    <td className="py-3 px-4 text-gray-300 text-sm">
                      {subscriber.firstName && subscriber.lastName
                        ? `${subscriber.firstName} ${subscriber.lastName}`
                        : subscriber.firstName || subscriber.lastName || "-"}
                    </td>
                    <td className="py-3 px-4 text-white text-sm">{subscriber.email}</td>
                    <td className="py-3 px-4 text-white text-sm">{subscriber.phoneNumber}</td>
                    <td className="py-3 px-4 text-gray-400 text-sm">
                      {format(new Date(subscriber.createdAt), "MMM dd, yyyy")}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
  
      {/* PAGINATION */}
      {paginatedSubscribers.length > 0 && (
        <>
          <div className="flex flex-row justify-center items-center gap-3 sm:gap-4 my-4 sm:my-6">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => p - 1)}
              disabled={currentPage === 1}
              className="w-10 h-10 sm:w-auto sm:h-auto sm:px-4 text-xs sm:text-sm"
            >
              <ArrowBigLeft className="w-3 h-3 sm:w-4 sm:h-4" />
             
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
                    className="w-8 h-8 sm:w-10 sm:h-10 text-xs"
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
              className="w-10 h-10 sm:w-auto sm:h-auto sm:px-4 text-xs sm:text-sm"
            >
              
              <ArrowBigRight className="w-3 h-3 sm:w-4 sm:h-4" />
            </Button>
          </div>
  
          <p className="text-center text-xs sm:text-sm text-gray-400">
            Showing {paginatedSubscribers?.length || 0} of {subscribers?.length || 0} filtered entries
          </p>
        </>
      )}
  
      {/* Campaigns List - Mobile View */}
      <div className="block md:hidden">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="p-4">
            <CardTitle className="text-white text-base sm:text-lg">Promotional Campaigns</CardTitle>
            <CardDescription className="text-gray-400 text-xs sm:text-sm">
              Create and send promotional emails to subscribers
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="space-y-3">
              {campaigns.length === 0 ? (
                <div className="text-center text-gray-500 py-6 text-sm">
                  No campaigns created yet
                </div>
              ) : (
                campaigns.map((campaign) => (
                  <div key={campaign.id} className="border border-zinc-800 rounded-lg p-3">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <div className="text-white font-medium text-sm truncate">{campaign.title}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`px-1.5 py-0.5 rounded text-xs ${
                            campaign.status === "sent"
                              ? "bg-green-900 text-green-300"
                              : campaign.status === "draft"
                              ? "bg-blue-900 text-blue-300"
                              : "bg-gray-800 text-gray-300"
                          }`}>
                            {campaign.status}
                          </span>
                          <span className="text-xs text-gray-400">• {campaign.offerType}</span>
                        </div>
                      </div>
                      <div className="text-xs text-gray-400">
                        {format(new Date(campaign.createdAt), "dd MMM")}
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center mt-3">
                      <div className="text-xs text-gray-400">
                        📧 {campaign.recipientCount || 0} recipients
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setViewCampaign(campaign)}
                          className="h-7 w-7 p-0"
                          data-testid={`button-view-campaign-${campaign.id}`}
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                        {campaign.status === "draft" && (
                          <>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setSendConfirmId(campaign.id)}
                              className="h-7 w-7 p-0 text-green-400"
                              data-testid={`button-send-campaign-${campaign.id}`}
                            >
                              <Send className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => deleteCampaignMutation.mutate(campaign.id)}
                              className="h-7 w-7 p-0 text-red-400"
                              data-testid={`button-delete-campaign-${campaign.id}`}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
  
      {/* Campaigns List - Desktop View */}
      <div className="hidden md:block bg-zinc-900 border-zinc-800 rounded-lg overflow-hidden">
        <div className="p-6 border-b border-zinc-800">
          <h3 className="text-white font-semibold text-lg">Promotional Campaigns</h3>
          <p className="text-gray-400 text-sm">
            Create and send promotional emails to your subscribers
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Title</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Type</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Status</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Recipients</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Created</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center text-gray-500 py-8 text-sm">
                    No campaigns created yet
                  </td>
                </tr>
              ) : (
                campaigns.map((campaign) => (
                  <tr key={campaign.id} className="border-b border-zinc-800 hover:bg-zinc-800/50" data-testid={`row-campaign-${campaign.id}`}>
                    <td className="py-3 px-4 text-white font-medium text-sm">{campaign.title}</td>
                    <td className="py-3 px-4 text-gray-300 text-sm capitalize">{campaign.offerType}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          campaign.status === "sent"
                            ? "bg-green-900 text-green-300"
                            : campaign.status === "draft"
                            ? "bg-blue-900 text-blue-300"
                            : "bg-gray-800 text-gray-300"
                        }`}
                      >
                        {campaign.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-400 text-sm">{campaign.recipientCount || 0}</td>
                    <td className="py-3 px-4 text-gray-400 text-sm">
                      {format(new Date(campaign.createdAt), "MMM dd, yyyy")}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setViewCampaign(campaign)}
                          className="border-zinc-700 hover:bg-zinc-800 h-8 text-xs"
                          data-testid={`button-view-campaign-${campaign.id}`}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          View
                        </Button>
                        {campaign.status === "draft" && (
                          <Button
                            size="sm"
                            onClick={() => setSendConfirmId(campaign.id)}
                            className="bg-green-600 hover:bg-green-700 h-8 text-xs"
                            data-testid={`button-send-campaign-${campaign.id}`}
                          >
                            <Send className="h-3 w-3 mr-1" />
                            Send
                          </Button>
                        )}
                        {campaign.status === "draft" && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => deleteCampaignMutation.mutate(campaign.id)}
                            className="h-8 text-xs"
                            data-testid={`button-delete-campaign-${campaign.id}`}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
  
      {/* Create Campaign Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-yellow-400 text-lg sm:text-xl">Create New Campaign</DialogTitle>
            <DialogDescription className="text-gray-400 text-sm">
              Create a promotional campaign to send to your newsletter subscribers
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleCreateCampaign)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-300 text-sm sm:text-base">Campaign Title</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="e.g., Spring Sale 2026"
                        className="bg-zinc-800 border-zinc-700 text-white text-sm sm:text-base"
                        data-testid="input-campaign-title"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
  
              <FormField
                control={form.control}
                name="subject"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-300 text-sm sm:text-base">Email Subject</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="e.g., Don't Miss Our Biggest Sale Yet!"
                        className="bg-zinc-800 border-zinc-700 text-white text-sm sm:text-base"
                        data-testid="input-campaign-subject"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
  
              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-300 text-sm sm:text-base">Message</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Write your promotional message here..."
                        className="bg-zinc-800 border-zinc-700 text-white text-sm sm:text-base min-h-[100px] sm:min-h-32"
                        data-testid="textarea-campaign-message"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
  
              <FormField
                control={form.control}
                name="offerType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-300 text-sm sm:text-base">Offer Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white text-sm sm:text-base" data-testid="select-offer-type">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-zinc-800 border-zinc-700">
                        <SelectItem value="announcement" className="text-sm sm:text-base">Announcement</SelectItem>
                        <SelectItem value="discount" className="text-sm sm:text-base">Discount Code</SelectItem>
                        <SelectItem value="bonus" className="text-sm sm:text-base">Bonus Reward</SelectItem>
                        <SelectItem value="custom" className="text-sm sm:text-base">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
  
              {form.watch("offerType") === "discount" && (
                <div className="space-y-3 sm:space-y-4 border border-zinc-800 rounded-lg p-3 sm:p-4">
                  <FormField
                    control={form.control}
                    name="discountCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-300 text-sm sm:text-base">Discount Code</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="e.g., SPRING25"
                            className="bg-zinc-800 border-zinc-700 text-white text-sm sm:text-base"
                            data-testid="input-discount-code"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="discountPercentage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-300 text-sm sm:text-base">Discount Percentage</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            placeholder="e.g., 25"
                            className="bg-zinc-800 border-zinc-700 text-white text-sm sm:text-base"
                            data-testid="input-discount-percentage"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
  
              {form.watch("offerType") === "bonus" && (
                <div className="space-y-3 sm:space-y-4 border border-zinc-800 rounded-lg p-3 sm:p-4">
                  <FormField
                    control={form.control}
                    name="bonusAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-300 text-sm sm:text-base">Bonus Cash Amount (£)</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="e.g., 10.00"
                            className="bg-zinc-800 border-zinc-700 text-white text-sm sm:text-base"
                            data-testid="input-bonus-amount"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="bonusPoints"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-300 text-sm sm:text-base">Bonus Points</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            placeholder="e.g., 500"
                            className="bg-zinc-800 border-zinc-700 text-white text-sm sm:text-base"
                            data-testid="input-bonus-points"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
  
              <FormField
                control={form.control}
                name="expiryDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-300 text-sm sm:text-base">Expiry Date (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="datetime-local"
                        className="bg-zinc-800 border-zinc-700 text-white text-sm sm:text-base"
                        data-testid="input-expiry-date"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
  
              <div className="flex flex-col sm:flex-row gap-2 pt-4">
                <Button
                  type="submit"
                  className="flex-1 bg-yellow-400 hover:bg-yellow-500 text-black text-sm sm:text-base py-2.5"
                  disabled={createCampaignMutation.isPending}
                  data-testid="button-submit-campaign"
                >
                  {createCampaignMutation.isPending ? "Creating..." : "Create Campaign"}
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    setCreateDialogOpen(false);
                    form.reset();
                  }}
                  variant="outline"
                  className="border-zinc-700 hover:bg-zinc-800 text-sm sm:text-base py-2.5"
                  data-testid="button-cancel-campaign"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
  
      {/* View Campaign Dialog */}
      <Dialog open={!!viewCampaign} onOpenChange={() => setViewCampaign(null)}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-[95vw] sm:max-w-2xl p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-yellow-400 text-lg sm:text-xl">{viewCampaign?.title}</DialogTitle>
            <DialogDescription className="text-gray-400 text-sm">Campaign Details</DialogDescription>
          </DialogHeader>
          {viewCampaign && (
            <div className="space-y-3 sm:space-y-4 max-h-[60vh] overflow-y-auto">
              <div>
                <Label className="text-gray-400 text-sm sm:text-base">Subject</Label>
                <p className="text-white mt-1 text-sm sm:text-base">{viewCampaign.subject}</p>
              </div>
              <div>
                <Label className="text-gray-400 text-sm sm:text-base">Message</Label>
                <p className="text-white mt-1 whitespace-pre-line text-sm sm:text-base">{viewCampaign.message}</p>
              </div>
              <div>
                <Label className="text-gray-400 text-sm sm:text-base">Offer Type</Label>
                <p className="text-white mt-1 text-sm sm:text-base capitalize">{viewCampaign.offerType}</p>
              </div>
              {viewCampaign.discountCode && (
                <div>
                  <Label className="text-gray-400 text-sm sm:text-base">Discount Code</Label>
                  <p className="text-white mt-1 font-mono text-sm sm:text-base">{viewCampaign.discountCode}</p>
                </div>
              )}
              {viewCampaign.discountPercentage && (
                <div>
                  <Label className="text-gray-400 text-sm sm:text-base">Discount</Label>
                  <p className="text-white mt-1 text-sm sm:text-base">{viewCampaign.discountPercentage}% off</p>
                </div>
              )}
              {viewCampaign.bonusAmount && (
                <div>
                  <Label className="text-gray-400 text-sm sm:text-base">Bonus Cash</Label>
                  <p className="text-white mt-1 text-sm sm:text-base">£{viewCampaign.bonusAmount}</p>
                </div>
              )}
              {viewCampaign.bonusPoints && (
                <div>
                  <Label className="text-gray-400 text-sm sm:text-base">Bonus Points</Label>
                  <p className="text-white mt-1 text-sm sm:text-base">{viewCampaign.bonusPoints} points</p>
                </div>
              )}
              {viewCampaign.expiryDate && (
                <div>
                  <Label className="text-gray-400 text-sm sm:text-base">Expires</Label>
                  <p className="text-white mt-1 text-sm sm:text-base">
                    {format(new Date(viewCampaign.expiryDate), "MMM dd, yyyy 'at' HH:mm")}
                  </p>
                </div>
              )}
              <div>
                <Label className="text-gray-400 text-sm sm:text-base">Status</Label>
                <p className="text-white mt-1 text-sm sm:text-base capitalize">{viewCampaign.status}</p>
              </div>
              {viewCampaign.sentAt && (
                <div>
                  <Label className="text-gray-400 text-sm sm:text-base">Sent At</Label>
                  <p className="text-white mt-1 text-sm sm:text-base">
                    {format(new Date(viewCampaign.sentAt), "MMM dd, yyyy 'at' HH:mm")}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
  
      {/* Send Confirmation Dialog */}
      <Dialog open={!!sendConfirmId} onOpenChange={() => setSendConfirmId(null)}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-[95vw] sm:max-w-md p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-yellow-400 text-lg sm:text-xl">Confirm Send Campaign</DialogTitle>
            <DialogDescription className="text-gray-400 text-sm">
              This will send this campaign to {stats?.totalSubscribers || 0} newsletter subscribers. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col sm:flex-row gap-2 pt-4">
            <Button
              onClick={() => sendConfirmId && sendCampaignMutation.mutate(sendConfirmId)}
              className="flex-1 bg-green-600 hover:bg-green-700 text-sm sm:text-base py-2.5"
              disabled={sendCampaignMutation.isPending}
              data-testid="button-confirm-send"
            >
              {sendCampaignMutation.isPending ? "Sending..." : "Yes, Send Campaign"}
            </Button>
            <Button
              onClick={() => setSendConfirmId(null)}
              variant="outline"
              className="border-zinc-700 hover:bg-zinc-800 text-sm sm:text-base py-2.5"
              data-testid="button-cancel-send"
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  </AdminLayout>
  );
}