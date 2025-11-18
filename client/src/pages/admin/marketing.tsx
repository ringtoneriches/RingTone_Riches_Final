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
import { Mail, Users, Send, TrendingUp, Plus, Trash2, Eye } from "lucide-react";
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

export default function AdminMarketing() {
  const { toast } = useToast();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [viewCampaign, setViewCampaign] = useState<Campaign | null>(null);
  const [sendConfirmId, setSendConfirmId] = useState<string | null>(null);

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

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-yellow-400">Marketing</h1>
            <p className="text-gray-400 mt-1">Manage newsletter subscribers and promotional campaigns</p>
          </div>
          <Button
            onClick={() => setCreateDialogOpen(true)}
            className="bg-yellow-400 hover:bg-yellow-500 text-black"
            data-testid="button-create-campaign"
          >
            <Plus className="mr-2 h-4 w-4" />
            New Campaign
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Total Subscribers</CardTitle>
              <Users className="h-4 w-4 text-yellow-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white" data-testid="text-total-subscribers">
                {stats?.totalSubscribers || 0}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Total Campaigns</CardTitle>
              <Mail className="h-4 w-4 text-yellow-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white" data-testid="text-total-campaigns">
                {stats?.totalCampaigns || 0}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Sent Campaigns</CardTitle>
              <Send className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white" data-testid="text-sent-campaigns">
                {stats?.sentCampaigns || 0}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Draft Campaigns</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white" data-testid="text-draft-campaigns">
                {stats?.draftCampaigns || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Newsletter Subscribers */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white">Newsletter Subscribers</CardTitle>
            <CardDescription className="text-gray-400">
              List of all users who subscribed to your newsletter
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-zinc-800">
                    <TableHead className="text-gray-400">Name</TableHead>
                    <TableHead className="text-gray-400">Email</TableHead>
                    <TableHead className="text-gray-400">Phone</TableHead>
                    <TableHead className="text-gray-400">Subscribed Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subscribers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-gray-500 py-8">
                        No subscribers yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    subscribers.map((subscriber) => (
                      <TableRow key={subscriber.id} className="border-zinc-800" data-testid={`row-subscriber-${subscriber.id}`}>
                        
                        <TableCell className="text-gray-300">
                          {subscriber.firstName && subscriber.lastName
                            ? `${subscriber.firstName} ${subscriber.lastName}`
                            : subscriber.firstName || subscriber.lastName || "-"}
                        </TableCell>
                        <TableCell className="text-white">{subscriber.email}</TableCell>
                        <TableCell className="text-white">{subscriber.phoneNumber}</TableCell>
                        <TableCell className="text-gray-400">
                          {format(new Date(subscriber.createdAt), "MMM dd, yyyy")}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Campaigns List */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white">Promotional Campaigns</CardTitle>
            <CardDescription className="text-gray-400">
              Create and send promotional emails to your subscribers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-zinc-800">
                    <TableHead className="text-gray-400">Title</TableHead>
                    <TableHead className="text-gray-400">Type</TableHead>
                    <TableHead className="text-gray-400">Status</TableHead>
                    <TableHead className="text-gray-400">Recipients</TableHead>
                    <TableHead className="text-gray-400">Created</TableHead>
                    <TableHead className="text-gray-400">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {campaigns.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                        No campaigns created yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    campaigns.map((campaign) => (
                      <TableRow key={campaign.id} className="border-zinc-800" data-testid={`row-campaign-${campaign.id}`}>
                        <TableCell className="text-white font-medium">{campaign.title}</TableCell>
                        <TableCell className="text-gray-300 capitalize">{campaign.offerType}</TableCell>
                        <TableCell>
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
                        </TableCell>
                        <TableCell className="text-gray-400">{campaign.recipientCount || 0}</TableCell>
                        <TableCell className="text-gray-400">
                          {format(new Date(campaign.createdAt), "MMM dd, yyyy")}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setViewCampaign(campaign)}
                              className="border-zinc-700 hover:bg-zinc-800"
                              data-testid={`button-view-campaign-${campaign.id}`}
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                            {campaign.status === "draft" && (
                              <Button
                                size="sm"
                                onClick={() => setSendConfirmId(campaign.id)}
                                className="bg-green-600 hover:bg-green-700"
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
                                data-testid={`button-delete-campaign-${campaign.id}`}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create Campaign Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-yellow-400">Create New Campaign</DialogTitle>
            <DialogDescription className="text-gray-400">
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
                    <FormLabel className="text-gray-300">Campaign Title</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="e.g., Spring Sale 2025"
                        className="bg-zinc-800 border-zinc-700 text-white"
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
                    <FormLabel className="text-gray-300">Email Subject</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="e.g., Don't Miss Our Biggest Sale Yet!"
                        className="bg-zinc-800 border-zinc-700 text-white"
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
                    <FormLabel className="text-gray-300">Message</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Write your promotional message here..."
                        className="bg-zinc-800 border-zinc-700 text-white min-h-32"
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
                    <FormLabel className="text-gray-300">Offer Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white" data-testid="select-offer-type">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-zinc-800 border-zinc-700">
                        <SelectItem value="announcement">Announcement</SelectItem>
                        <SelectItem value="discount">Discount Code</SelectItem>
                        <SelectItem value="bonus">Bonus Reward</SelectItem>
                        <SelectItem value="custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {form.watch("offerType") === "discount" && (
                <>
                  <FormField
                    control={form.control}
                    name="discountCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-300">Discount Code</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="e.g., SPRING25"
                            className="bg-zinc-800 border-zinc-700 text-white"
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
                        <FormLabel className="text-gray-300">Discount Percentage</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            placeholder="e.g., 25"
                            className="bg-zinc-800 border-zinc-700 text-white"
                            data-testid="input-discount-percentage"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              {form.watch("offerType") === "bonus" && (
                <>
                  <FormField
                    control={form.control}
                    name="bonusAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-300">Bonus Cash Amount (£)</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="e.g., 10.00"
                            className="bg-zinc-800 border-zinc-700 text-white"
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
                        <FormLabel className="text-gray-300">Bonus Points</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            placeholder="e.g., 500"
                            className="bg-zinc-800 border-zinc-700 text-white"
                            data-testid="input-bonus-points"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              <FormField
                control={form.control}
                name="expiryDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-300">Expiry Date (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="datetime-local"
                        className="bg-zinc-800 border-zinc-700 text-white"
                        data-testid="input-expiry-date"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-2 pt-4">
                <Button
                  type="submit"
                  className="flex-1 bg-yellow-400 hover:bg-yellow-500 text-black"
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
                  className="border-zinc-700 hover:bg-zinc-800"
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
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-yellow-400">{viewCampaign?.title}</DialogTitle>
            <DialogDescription className="text-gray-400">Campaign Details</DialogDescription>
          </DialogHeader>
          {viewCampaign && (
            <div className="space-y-4">
              <div>
                <Label className="text-gray-400">Subject</Label>
                <p className="text-white mt-1">{viewCampaign.subject}</p>
              </div>
              <div>
                <Label className="text-gray-400">Message</Label>
                <p className="text-white mt-1 whitespace-pre-line">{viewCampaign.message}</p>
              </div>
              <div>
                <Label className="text-gray-400">Offer Type</Label>
                <p className="text-white mt-1 capitalize">{viewCampaign.offerType}</p>
              </div>
              {viewCampaign.discountCode && (
                <div>
                  <Label className="text-gray-400">Discount Code</Label>
                  <p className="text-white mt-1 font-mono">{viewCampaign.discountCode}</p>
                </div>
              )}
              {viewCampaign.discountPercentage && (
                <div>
                  <Label className="text-gray-400">Discount</Label>
                  <p className="text-white mt-1">{viewCampaign.discountPercentage}% off</p>
                </div>
              )}
              {viewCampaign.bonusAmount && (
                <div>
                  <Label className="text-gray-400">Bonus Cash</Label>
                  <p className="text-white mt-1">£{viewCampaign.bonusAmount}</p>
                </div>
              )}
              {viewCampaign.bonusPoints && (
                <div>
                  <Label className="text-gray-400">Bonus Points</Label>
                  <p className="text-white mt-1">{viewCampaign.bonusPoints} points</p>
                </div>
              )}
              {viewCampaign.expiryDate && (
                <div>
                  <Label className="text-gray-400">Expires</Label>
                  <p className="text-white mt-1">
                    {format(new Date(viewCampaign.expiryDate), "MMMM dd, yyyy 'at' HH:mm")}
                  </p>
                </div>
              )}
              <div>
                <Label className="text-gray-400">Status</Label>
                <p className="text-white mt-1 capitalize">{viewCampaign.status}</p>
              </div>
              {viewCampaign.sentAt && (
                <div>
                  <Label className="text-gray-400">Sent At</Label>
                  <p className="text-white mt-1">
                    {format(new Date(viewCampaign.sentAt), "MMMM dd, yyyy 'at' HH:mm")}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Send Confirmation Dialog */}
      <Dialog open={!!sendConfirmId} onOpenChange={() => setSendConfirmId(null)}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white">
          <DialogHeader>
            <DialogTitle className="text-yellow-400">Confirm Send Campaign</DialogTitle>
            <DialogDescription className="text-gray-400">
              This will send this campaign to {stats?.totalSubscribers || 0} newsletter subscribers. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 pt-4">
            <Button
              onClick={() => sendConfirmId && sendCampaignMutation.mutate(sendConfirmId)}
              className="flex-1 bg-green-600 hover:bg-green-700"
              disabled={sendCampaignMutation.isPending}
              data-testid="button-confirm-send"
            >
              {sendCampaignMutation.isPending ? "Sending..." : "Yes, Send Campaign"}
            </Button>
            <Button
              onClick={() => setSendConfirmId(null)}
              variant="outline"
              className="border-zinc-700 hover:bg-zinc-800"
              data-testid="button-cancel-send"
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}