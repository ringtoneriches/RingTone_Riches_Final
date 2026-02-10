import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  CheckCircle,
  XCircle,
  Eye,
  Clock,
  User,
  Mail,
  Calendar,
  AlertCircle,
  Shield,
  FileText,
  ExternalLink,
  Image as ImageIcon,
  Smile,
  Trash2,
} from "lucide-react";
import { format } from "date-fns";
import AdminLayout from "@/components/admin/admin-layout";

export default function AdminVerifications() {
  const { toast } = useToast();
  const [selectedVerification, setSelectedVerification] = useState<any>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [rejectionModalOpen, setRejectionModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [verificationToDelete, setVerificationToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [reviewStatus, setReviewStatus] = useState<"approved" | "rejected">("approved");
  const [adminNotes, setAdminNotes] = useState("");

  useEffect(() => {
    apiRequest("/api/admin/verification/mark-read", "POST")
      .then(() => {
        queryClient.invalidateQueries({
          queryKey: ["/api/admin/verification/unread-count"],
        });
      })
      .catch(console.error);
  }, []);

  const { data: verifications, refetch, isLoading } = useQuery({
    queryKey: ["/api/admin/verifications", "all"],
    queryFn: async () => {
      const res = await fetch("/api/admin/verifications?status=all", { credentials: "include" });
      return res.json();
    },
  });

  const reviewMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: string; notes: string }) => {
      return apiRequest(`/api/admin/verifications/${id}/review`, "POST", {
        status,
        adminNotes: notes,
      });
    },
    onSuccess: () => {
      toast({
        title: "Verification Reviewed",
        description: `Verification ${reviewStatus}`,
      });
      setReviewDialogOpen(false);
      setSelectedVerification(null);
      setAdminNotes("");
      refetch();
      queryClient.invalidateQueries({ queryKey: ["/api/admin/verifications"] });
    },
    onError: (error: any) => {
      toast({
        title: "Review Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleDelete = async (id: string) => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/verifications/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to delete");
      }

      toast({
        title: "Deleted",
        description: "The verification has been deleted successfully.",
      });

      // Refresh the data after deletion
      refetch();
      queryClient.invalidateQueries({ queryKey: ["/api/admin/verifications"] });
      
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to delete verification",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setVerificationToDelete(null);
    }
  };

  const handleReview = (verification: any, status: "approved" | "rejected") => {
    setSelectedVerification(verification);
    setReviewStatus(status);
    setReviewDialogOpen(true);
  };

  const confirmReview = () => {
    if (!selectedVerification) return;
    
    reviewMutation.mutate({
      id: selectedVerification.id,
      status: reviewStatus,
      notes: adminNotes,
    });
  };

  const openDeleteDialog = (id: string) => {
    setVerificationToDelete(id);
    setDeleteDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
      case "approved":
        return (
          <Badge className="bg-green-500/20 text-green-500 border-green-500/30">
            <CheckCircle className="w-3 h-3 mr-1" />
            Approved
          </Badge>
        );
      case "rejected":
        return (
          <Badge className="bg-red-500/20 text-red-500 border-red-500/30">
            <XCircle className="w-3 h-3 mr-1" />
            Rejected
          </Badge>
        );
    }
  };

  const pendingVerifications = Array.isArray(verifications)
    ? verifications.filter((v: any) => v.status === "pending")
    : [];
  const approvedVerifications = Array.isArray(verifications)
    ? verifications.filter((v: any) => v.status === "approved")
    : [];
  const rejectedVerifications = Array.isArray(verifications)
    ? verifications.filter((v: any) => v.status === "rejected")
    : [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  // Table component for large screens
  const VerificationTable = ({ verifications, showActions = true, showRejectionReason = false }) => (
    <div className="hidden md:block overflow-x-auto border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Document Type</TableHead>
            <TableHead>Submitted</TableHead>
            <TableHead>Status</TableHead>
            {showRejectionReason && <TableHead>Rejection Reason</TableHead>}
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {verifications.map((verification: any) => (
            <TableRow key={verification.id}>
              <TableCell>
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  {verification.user?.name || "No name provided"}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  {verification.user?.email}
                </div>
              </TableCell>
              <TableCell className="capitalize">
                {verification.documentType?.replace("_", " ") || "Unknown"}
              </TableCell>
              <TableCell>
                {format(new Date(verification.createdAt), "dd MMM yyyy")}
              </TableCell>
              <TableCell>
                {getStatusBadge(verification.status)}
              </TableCell>
              {showRejectionReason && (
                <TableCell>
                  {verification.adminNotes ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedVerification(verification);
                        setRejectionModalOpen(true);
                      }}
                      className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
                    >
                      <Smile className="w-3 h-3 mr-1" />
                      View Reason
                    </Button>
                  ) : (
                    <span className="text-muted-foreground text-sm">-</span>
                  )}
                </TableCell>
              )}
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(verification.documentImageUrl, "_blank")}
                    className="h-8"
                  >
                    <Eye className="w-3 h-3" />
                  </Button>
                  {showActions && verification.status === "pending" && (
                    <>
                      <Button
                        size="sm"
                        onClick={() => handleReview(verification, "approved")}
                        className="h-8 bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleReview(verification, "rejected")}
                        className="h-8"
                      >
                        <XCircle className="w-3 h-3" />
                      </Button>
                    </>
                  )}
                  {!showActions && verification.status === "rejected" && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleReview(verification, "approved")}
                        className="h-8 text-green-600 border-green-600 hover:bg-green-50"
                      >
                        <CheckCircle className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => openDeleteDialog(verification.id)}
                        className="h-8"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </>
                  )}
                  {!showActions && verification.status === "approved" && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => openDeleteDialog(verification.id)}
                      className="h-8"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );

  // Card component for mobile
  const VerificationCard = ({ verification, showActions = true, showRejectionReason = false }) => (
    <Card key={verification.id} className="md:hidden">
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                {getStatusBadge(verification.status)}
                <span className="text-sm text-muted-foreground">
                  {format(new Date(verification.createdAt), "dd MMM yyyy")}
                </span>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">{verification.user?.name || "No name provided"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">{verification.user?.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm capitalize">
                    {verification.documentType?.replace("_", " ") || "Unknown"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {showRejectionReason && verification.adminNotes && (
            <div className="pt-2 border-t">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedVerification(verification);
                  setRejectionModalOpen(true);
                }}
                className="w-full justify-start h-8 text-muted-foreground hover:text-foreground"
              >
                <Smile className="w-3 h-3 mr-2" />
                View Rejection Reason
              </Button>
            </div>
          )}

          <div className="flex gap-2 pt-2 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(verification.documentImageUrl, "_blank")}
              className="flex-1"
            >
              <Eye className="w-3 h-3 mr-1" />
              View ID
            </Button>
            
            {showActions && verification.status === "pending" && (
              <>
                <Button
                  size="sm"
                  onClick={() => handleReview(verification, "approved")}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Approve
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleReview(verification, "rejected")}
                  className="flex-1"
                >
                  <XCircle className="w-3 h-3 mr-1" />
                  Reject
                </Button>
              </>
            )}
            {!showActions && verification.status === "rejected" && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleReview(verification, "approved")}
                  className="flex-1 text-green-600 border-green-600 hover:bg-green-50"
                >
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Approve
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => openDeleteDialog(verification.id)}
                  className="flex-1"
                >
                  <Trash2 className="w-3 h-3 mr-1" />
                  Delete
                </Button>
              </>
            )}
            {!showActions && verification.status === "approved" && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => openDeleteDialog(verification.id)}
                className="flex-1"
              >
                <Trash2 className="w-3 h-3 mr-1" />
                Delete
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // Find the verification being deleted for display purposes
  const verificationBeingDeleted = [...approvedVerifications, ...rejectedVerifications]
    .find(v => v.id === verificationToDelete);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">ID Verifications</h1>
          <p className="text-muted-foreground mt-2">
            Review and manage customer identity verification requests
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-yellow-500/20 rounded-full mb-3">
                  <Clock className="w-6 h-6 text-yellow-500" />
                </div>
                <p className="text-2xl font-bold">{pendingVerifications.length}</p>
                <p className="text-sm text-muted-foreground">Pending Review</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-green-500/20 rounded-full mb-3">
                  <CheckCircle className="w-6 h-6 text-green-500" />
                </div>
                <p className="text-2xl font-bold">{approvedVerifications.length}</p>
                <p className="text-sm text-muted-foreground">Approved</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-red-500/20 rounded-full mb-3">
                  <XCircle className="w-6 h-6 text-red-500" />
                </div>
                <p className="text-2xl font-bold">{rejectedVerifications.length}</p>
                <p className="text-sm text-muted-foreground">Rejected</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="pending" className="w-full">
          <TabsList>
            <TabsTrigger value="pending" className="relative">
              Pending
              {pendingVerifications.length > 0 && (
                <span className="ml-2 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-bold text-white bg-yellow-500 rounded-full">
                  {pendingVerifications.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="approved">Approved</TabsTrigger>
            <TabsTrigger value="rejected">Rejected</TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-4">
            {pendingVerifications.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center">
                  <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-lg font-medium">No pending verifications</p>
                  <p className="text-sm text-muted-foreground">
                    All verification requests have been processed
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                <VerificationTable verifications={pendingVerifications} showActions={true} />
                {pendingVerifications.map((verification: any) => (
                  <VerificationCard 
                    key={verification.id} 
                    verification={verification} 
                    showActions={true}
                  />
                ))}
              </>
            )}
          </TabsContent>

          <TabsContent value="approved" className="space-y-4">
            {approvedVerifications.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                  <p className="text-lg font-medium">No approved verifications</p>
                  <p className="text-sm text-muted-foreground">
                    No verifications have been approved yet
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                <VerificationTable verifications={approvedVerifications} showActions={false} />
                {approvedVerifications.map((verification: any) => (
                  <VerificationCard 
                    key={verification.id} 
                    verification={verification} 
                    showActions={false}
                  />
                ))}
              </>
            )}
          </TabsContent>

          <TabsContent value="rejected" className="space-y-4">
            {rejectedVerifications.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center">
                  <XCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
                  <p className="text-lg font-medium">No rejected verifications</p>
                  <p className="text-sm text-muted-foreground">
                    No verifications have been rejected
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                <VerificationTable 
                  verifications={rejectedVerifications} 
                  showActions={false} 
                  showRejectionReason={true}
                />
                {rejectedVerifications.map((verification: any) => (
                  <VerificationCard 
                    key={verification.id} 
                    verification={verification} 
                    showActions={false}
                    showRejectionReason={true}
                  />
                ))}
              </>
            )}
          </TabsContent>
        </Tabs>

        {/* Review Dialog */}
        <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {reviewStatus === "approved" ? (
                  <>
                    <CheckCircle className="w-6 h-6 text-green-600" />
                    Approve Verification
                  </>
                ) : (
                  <>
                    <XCircle className="w-6 h-6 text-red-600" />
                    Reject Verification
                  </>
                )}
              </DialogTitle>
              <DialogDescription>
                {selectedVerification?.user?.name 
                  ? `Review verification for ${selectedVerification.user.name}`
                  : "Review verification"}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {selectedVerification && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">User:</span>
                    <span className="text-sm">{selectedVerification.user?.email}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Document Type:</span>
                    <span className="text-sm capitalize">
                      {selectedVerification.documentType?.replace("_", " ")}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Submitted:</span>
                    <span className="text-sm">
                      {format(new Date(selectedVerification.createdAt), "dd MMM yyyy")}
                    </span>
                  </div>
                  
                  <div className="mt-3">
                    <Label htmlFor="document-image" className="text-sm font-medium">
                      ID Document Preview
                    </Label>
                    <div className="mt-2 border rounded-lg overflow-hidden">
                      <img
                        src={selectedVerification.documentImageUrl}
                        alt="ID Document"
                        className="w-full h-48 object-contain bg-gray-50"
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(selectedVerification.documentImageUrl, "_blank")}
                      className="mt-2 text-xs flex items-center gap-1"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Open in new tab
                    </Button>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="adminNotes">
                  {reviewStatus === "approved" ? "Approval Notes (Optional)" : "Rejection Reason *"}
                </Label>
                <Textarea
                  id="adminNotes"
                  placeholder={
                    reviewStatus === "approved" 
                      ? "Add any notes about this approval..."
                      : "Explain why the verification is being rejected..."
                  }
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  className="min-h-[100px]"
                  required={reviewStatus === "rejected"}
                />
                {reviewStatus === "rejected" && (
                  <p className="text-xs text-red-500">
                    Rejection reason is required to help the user understand what needs to be corrected.
                  </p>
                )}
              </div>

              {reviewStatus === "rejected" && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-yellow-700">
                      <p className="font-medium">Note:</p>
                      <p>The user will see this rejection reason and will need to submit a new verification request.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <DialogFooter className="gap-3">
              <Button
                variant="outline"
                onClick={() => setReviewDialogOpen(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={confirmReview}
                disabled={reviewMutation.isPending || (reviewStatus === "rejected" && !adminNotes.trim())}
                className={`flex-1 ${
                  reviewStatus === "approved" 
                    ? "bg-green-600 hover:bg-green-700" 
                    : "bg-red-600 hover:bg-red-700"
                }`}
              >
                {reviewMutation.isPending ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                    Processing...
                  </>
                ) : reviewStatus === "approved" ? (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Approve Verification
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4 mr-2" />
                    Reject Verification
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Rejection Reason Modal */}
        <AlertDialog open={rejectionModalOpen} onOpenChange={setRejectionModalOpen}>
          <AlertDialogContent className="sm:max-w-md">
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <Smile className="w-6 h-6 text-red-600" />
                Rejection Reason
              </AlertDialogTitle>
              <AlertDialogDescription>
                Why this verification was rejected
              </AlertDialogDescription>
            </AlertDialogHeader>
            
            {selectedVerification && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">{selectedVerification.user?.name || "No name"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{selectedVerification.user?.email}</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Rejected on {format(new Date(selectedVerification.reviewedAt), "dd MMM yyyy 'at' HH:mm")}
                  </div>
                </div>
                
                <div className="border border-gray-600 pl-4 py-2 rounded-md">
                  <p className="text-sm font-medium text-red-700 mb-1">Rejection Reason:</p>
                  <p className="text-sm text-white">{selectedVerification.adminNotes}</p>
                </div>
              </div>
            )}
            
            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setRejectionModalOpen(false)}
              >
                Close
              </Button>
              <Button
                onClick={() => {
                  setRejectionModalOpen(false);
                  handleReview(selectedVerification, "approved");
                }}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Approve Now
              </Button>
            </div>
          </AlertDialogContent>
        </AlertDialog>

        {/* Delete Confirmation Modal */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent className="sm:max-w-md">
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                <Trash2 className="w-6 h-6" />
                Delete Verification
              </AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the verification record
                {verificationBeingDeleted?.user?.name ? ` for ${verificationBeingDeleted.user.name}` : ''}.
              </AlertDialogDescription>
            </AlertDialogHeader>

            {verificationBeingDeleted && (
              <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">{verificationBeingDeleted.user?.name || "No name provided"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{verificationBeingDeleted.user?.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm capitalize">
                      {verificationBeingDeleted.documentType?.replace("_", " ") || "Unknown"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">
                      Submitted: {format(new Date(verificationBeingDeleted.createdAt), "dd MMM yyyy")}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => verificationToDelete && handleDelete(verificationToDelete)}
                disabled={isDeleting || !verificationToDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isDeleting ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Permanently
                  </>
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
}