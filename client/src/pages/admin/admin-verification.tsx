import { useEffect, useState, useMemo } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
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
  Cake,
  IdCard,
  CheckCheck,
  Search,
  X,
} from "lucide-react";
import { format, differenceInYears } from "date-fns";
import AdminLayout from "@/components/admin/admin-layout";

// Minimum age requirement (change this as needed)
const MINIMUM_AGE = 18;

// Helper function to calculate age from date of birth
const calculateAge = (birthDate: string | Date | null): number | null => {
  if (!birthDate) return null;
  const birth = new Date(birthDate);
  if (isNaN(birth.getTime())) return null;
  return differenceInYears(new Date(), birth);
};

// Helper function to format date safely
const formatDate = (date: string | Date | null): string => {
  if (!date) return "Not provided";
  try {
    return format(new Date(date), "dd MMM yyyy");
  } catch {
    return "Invalid date";
  }
};

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
  
  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  
  // New state for age verification
  const [ageVerified, setAgeVerified] = useState(false);
  const [idDobMatch, setIdDobMatch] = useState(false);
  const [idNameMatch, setIdNameMatch] = useState(false);
  const [minimumAgeMet, setMinimumAgeMet] = useState(false);
  const [extractedDob, setExtractedDob] = useState<string>("");

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
    mutationFn: async ({ 
      id, 
      status, 
      notes,
      ageVerified,
      idDobMatch,
      idNameMatch,
      minimumAgeMet,
      extractedDob
    }: { 
      id: string; 
      status: string; 
      notes: string;
      ageVerified: boolean;
      idDobMatch: boolean;
      idNameMatch: boolean;
      minimumAgeMet: boolean;
      extractedDob?: string;
    }) => {
      return apiRequest(`/api/admin/verifications/${id}/review`, "POST", {
        status,
        adminNotes: notes,
        ageVerified,
        idDobMatch,
        idNameMatch,
        minimumAgeMet,
        extractedDob: extractedDob || null,
      });
    },
    onSuccess: () => {
      toast({
        title: "Verification Reviewed",
        description: `Verification ${reviewStatus} with age verification checks`,
      });
      setReviewDialogOpen(false);
      setSelectedVerification(null);
      setAdminNotes("");
      
      // Reset age verification state
      setAgeVerified(false);
      setIdDobMatch(false);
      setIdNameMatch(false);
      setMinimumAgeMet(false);
      setExtractedDob("");
      
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
    
    // Calculate if minimum age is met based on user's DOB
    if (verification.user?.dateOfBirth) {
      const age = calculateAge(verification.user.dateOfBirth);
      setMinimumAgeMet(age !== null && age >= MINIMUM_AGE);
    } else {
      setMinimumAgeMet(false);
    }
    
    // Reset other checkboxes
    setAgeVerified(false);
    setIdDobMatch(false);
    setIdNameMatch(false);
    setExtractedDob("");
    
    setReviewDialogOpen(true);
  };

  const confirmReview = () => {
    if (!selectedVerification) return;
    
    // For rejection, we don't need age verification checks
    if (reviewStatus === "rejected") {
      reviewMutation.mutate({
        id: selectedVerification.id,
        status: reviewStatus,
        notes: adminNotes,
        ageVerified: false,
        idDobMatch: false,
        idNameMatch: false,
        minimumAgeMet: false,
      });
      return;
    }
    
    // For approval, validate that age verification checks are done
    if (!ageVerified) {
      toast({
        title: "Age Verification Required",
        description: "You must confirm that you've verified the age/DOB on the ID",
        variant: "destructive",
      });
      return;
    }
    
    if (!idDobMatch) {
      toast({
        title: "DOB Match Required",
        description: "The date of birth on the ID must match the account",
        variant: "destructive",
      });
      return;
    }
    
    if (!idNameMatch) {
      toast({
        title: "Name Match Required",
        description: "The name on the ID must match the account",
        variant: "destructive",
      });
      return;
    }
    
    if (!minimumAgeMet) {
      toast({
        title: "Minimum Age Requirement",
        description: `User must be at least ${MINIMUM_AGE} years old`,
        variant: "destructive",
      });
      return;
    }
    
    reviewMutation.mutate({
      id: selectedVerification.id,
      status: reviewStatus,
      notes: adminNotes,
      ageVerified,
      idDobMatch,
      idNameMatch,
      minimumAgeMet,
      extractedDob: extractedDob || undefined,
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

  // Filter verifications based on search query
  const filterVerifications = (verifications: any[]) => {
    if (!searchQuery.trim()) return verifications;
    
    const query = searchQuery.toLowerCase().trim();
    return verifications.filter((v: any) => {
      const name = v.user?.name?.toLowerCase() || "";
      const email = v.user?.email?.toLowerCase() || "";
      return name.includes(query) || email.includes(query);
    });
  };

  // Get filtered lists
  const pendingVerifications = useMemo(() => {
    const all = Array.isArray(verifications)
      ? verifications.filter((v: any) => v.status === "pending")
      : [];
    return filterVerifications(all);
  }, [verifications, searchQuery]);

  const approvedVerifications = useMemo(() => {
    const all = Array.isArray(verifications)
      ? verifications.filter((v: any) => v.status === "approved")
      : [];
    return filterVerifications(all);
  }, [verifications, searchQuery]);

  const rejectedVerifications = useMemo(() => {
    const all = Array.isArray(verifications)
      ? verifications.filter((v: any) => v.status === "rejected")
      : [];
    return filterVerifications(all);
  }, [verifications, searchQuery]);

  // Calculate original counts for the header cards (unfiltered)
  const originalPendingCount = Array.isArray(verifications)
    ? verifications.filter((v: any) => v.status === "pending").length
    : 0;
  const originalApprovedCount = Array.isArray(verifications)
    ? verifications.filter((v: any) => v.status === "approved").length
    : 0;
  const originalRejectedCount = Array.isArray(verifications)
    ? verifications.filter((v: any) => v.status === "rejected").length
    : 0;

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
            <TableHead>Age</TableHead>
            <TableHead>Submitted</TableHead>
            <TableHead>Status</TableHead>
            {showRejectionReason && <TableHead>Rejection Reason</TableHead>}
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {verifications.map((verification: any) => {
            const age = calculateAge(verification.user?.dateOfBirth);
            return (
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
                  {age ? (
                    <Badge variant={age >= MINIMUM_AGE ? "default" : "destructive"} className="whitespace-nowrap">
                      <Cake className="w-3 h-3 mr-1" />
                      {age} years
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground text-sm">-</span>
                  )}
                </TableCell>
                <TableCell>
                  {formatDate(verification.createdAt)}
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
            );
          })}
        </TableBody>
      </Table>
    </div>
  );

  // Card component for mobile
  const VerificationCard = ({ verification, showActions = true, showRejectionReason = false }) => {
    const age = calculateAge(verification.user?.dateOfBirth);
    return (
      <Card key={verification.id} className="md:hidden">
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  {getStatusBadge(verification.status)}
                  <span className="text-sm text-muted-foreground">
                    {formatDate(verification.createdAt)}
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
                  {age && (
                    <div className="flex items-center gap-2">
                      <Cake className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">
                        Age: {age} years {age < MINIMUM_AGE && "(Underage)"}
                      </span>
                    </div>
                  )}
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
  };

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

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-yellow-500/20 rounded-full mb-3">
                  <Clock className="w-6 h-6 text-yellow-500" />
                </div>
                <p className="text-2xl font-bold">{originalPendingCount}</p>
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
                <p className="text-2xl font-bold">{originalApprovedCount}</p>
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
                <p className="text-2xl font-bold">{originalRejectedCount}</p>
                <p className="text-sm text-muted-foreground">Rejected</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-500/20 rounded-full mb-3">
                  <Cake className="w-6 h-6 text-blue-500" />
                </div>
                <p className="text-2xl font-bold">{MINIMUM_AGE}+</p>
                <p className="text-sm text-muted-foreground">Minimum Age</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search Bar */}
        <Card className="bg-black/50">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-black/50 "
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              {searchQuery && (
                <div className="text-sm text-muted-foreground whitespace-nowrap">
                  Found: {pendingVerifications.length + approvedVerifications.length + rejectedVerifications.length} results
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="pending" className="w-full">
          <TabsList>
            <TabsTrigger value="pending" className="relative">
              Pending
             
            </TabsTrigger>
            <TabsTrigger value="approved">
              Approved
              
            </TabsTrigger>
            <TabsTrigger value="rejected">
              Rejected
              
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-4">
            {pendingVerifications.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center">
                  {searchQuery ? (
                    <>
                      <Search className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                      <p className="text-lg font-medium">No matching pending verifications</p>
                      <p className="text-sm text-muted-foreground">
                        Try adjusting your search query
                      </p>
                    </>
                  ) : (
                    <>
                      <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                      <p className="text-lg font-medium">No pending verifications</p>
                      <p className="text-sm text-muted-foreground">
                        All verification requests have been processed
                      </p>
                    </>
                  )}
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
                  {searchQuery ? (
                    <>
                      <Search className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                      <p className="text-lg font-medium">No matching approved verifications</p>
                      <p className="text-sm text-muted-foreground">
                        Try adjusting your search query
                      </p>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                      <p className="text-lg font-medium">No approved verifications</p>
                      <p className="text-sm text-muted-foreground">
                        No verifications have been approved yet
                      </p>
                    </>
                  )}
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
                  {searchQuery ? (
                    <>
                      <Search className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                      <p className="text-lg font-medium">No matching rejected verifications</p>
                      <p className="text-sm text-muted-foreground">
                        Try adjusting your search query
                      </p>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
                      <p className="text-lg font-medium">No rejected verifications</p>
                      <p className="text-sm text-muted-foreground">
                        No verifications have been rejected
                      </p>
                    </>
                  )}
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

        {/* Review Dialog with Age Verification */}
        <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {reviewStatus === "approved" ? (
                  <>
                    <CheckCircle className="w-6 h-6 text-green-600" />
                    Approve Verification with Age Check
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

            <div className="space-y-6">
              {selectedVerification && (
                <>
                  {/* User Info Section */}
                  <div className="space-y-3 bg-muted/30 p-4 rounded-lg">
                    <h3 className="font-semibold flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Account Information
                    </h3>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-muted-foreground">Name:</span>
                        <p className="font-medium">{selectedVerification.user?.name || "Not provided"}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Email:</span>
                        <p className="font-medium">{selectedVerification.user?.email}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Document Type:</span>
                        <p className="font-medium capitalize">
                          {selectedVerification.documentType?.replace("_", " ")}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Submitted:</span>
                        <p className="font-medium">
                          {formatDate(selectedVerification.createdAt)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Age Verification Section */}
                  <div className="space-y-3 border border-yellow-500/30 bg-yellow-500/5 p-4 rounded-lg">
                    <h3 className="font-semibold flex items-center gap-2 text-yellow-400">
                      <Cake className="w-5 h-5" />
                      Age Verification Checklist
                    </h3>
                    
                    <div className="space-y-4">
                      {/* Account DOB */}
                      <div className="bg-black/20 p-3 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">Account Date of Birth:</span>
                          <Badge variant="outline" className="font-mono">
                            {formatDate(selectedVerification.user?.dateOfBirth)}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Calculated Age:</span>
                          {selectedVerification.user?.dateOfBirth ? (
                            <Badge className={calculateAge(selectedVerification.user.dateOfBirth) >= MINIMUM_AGE ? "bg-green-600" : "bg-red-600"}>
                              {calculateAge(selectedVerification.user.dateOfBirth)} years
                            </Badge>
                          ) : (
                            <Badge variant="destructive">No DOB on file</Badge>
                          )}
                        </div>
                      </div>

                      {/* ID Preview with instructions */}
                      <div>
                        <Label className="text-sm font-medium mb-2 block">
                          ID Document Preview
                        </Label>
                        <div className="border-2 border-dashed border-yellow-500/30 rounded-lg overflow-hidden bg-black/40">
                          <img
                            src={selectedVerification.documentImageUrl}
                            alt="ID Document"
                            className="w-full max-h-64 object-contain"
                          />
                        </div>
                        <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          Verify that the name and date of birth on the ID match the account details above
                        </p>
                      </div>
                        { reviewStatus != "rejected" && (

                            <div className="space-y-3 border-t border-yellow-500/20 pt-4">
                            <p className="text-sm text-yellow-400 flex items-center gap-2">
                              <AlertCircle className="w-4 h-4" />
                              Complete all checks before approving
                            </p>
                            
                            <div className="flex items-start space-x-2">
                              <Checkbox 
                                id="ageVerified" 
                                checked={ageVerified}
                                onCheckedChange={(checked) => setAgeVerified(checked as boolean)}
                              />
                              <Label htmlFor="ageVerified" className="text-sm leading-tight">
                                I have verified the date of birth on the ID document
                              </Label>
                            </div>
    
                            <div className="flex items-start space-x-2">
                              <Checkbox 
                                id="idDobMatch" 
                                checked={idDobMatch}
                                onCheckedChange={(checked) => setIdDobMatch(checked as boolean)}
                              />
                              <Label htmlFor="idDobMatch" className="text-sm leading-tight">
                                The date of birth on the ID matches the account date of birth
                              </Label>
                            </div>
    
                            <div className="flex items-start space-x-2">
                              <Checkbox 
                                id="idNameMatch" 
                                checked={idNameMatch}
                                onCheckedChange={(checked) => setIdNameMatch(checked as boolean)}
                              />
                              <Label htmlFor="idNameMatch" className="text-sm leading-tight">
                                The name on the ID matches the account name
                              </Label>
                            </div>
    
                            <div className="flex items-start space-x-2">
                              <Checkbox 
                                id="minimumAgeMet" 
                                checked={minimumAgeMet}
                                onCheckedChange={(checked) => setMinimumAgeMet(checked as boolean)}
                              />
                              <Label htmlFor="minimumAgeMet" className="text-sm leading-tight">
                                User meets the minimum age requirement ({MINIMUM_AGE}+ years)
                              </Label>
                            </div>
                          </div>
                        )
                          
                        }
                    </div>
                  </div>

                  {/* Admin Notes Section */}
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
                </>
              )}
            </div>

            <DialogFooter className="gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setReviewDialogOpen(false);
                  setAgeVerified(false);
                  setIdDobMatch(false);
                  setIdNameMatch(false);
                  setMinimumAgeMet(false);
                  setExtractedDob("");
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={confirmReview}
                disabled={
                  reviewMutation.isPending || 
                  (reviewStatus === "rejected" && !adminNotes.trim())
                }
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
                    Approve with Age Check
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
                  <div className="flex items-center gap-2">
                    <Cake className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">DOB: {formatDate(selectedVerification.user?.dateOfBirth)}</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Rejected on {formatDate(selectedVerification.reviewedAt)}
                  </div>
                </div>
                
                <div className="border border-red-800 bg-red-950/30 p-4 rounded-md">
                  <p className="text-sm font-medium text-red-400 mb-2">Rejection Reason:</p>
                  <p className="text-sm text-gray-300">{selectedVerification.adminNotes}</p>
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
                    <Cake className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">DOB: {formatDate(verificationBeingDeleted.user?.dateOfBirth)}</span>
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
                      Submitted: {formatDate(verificationBeingDeleted.createdAt)}
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