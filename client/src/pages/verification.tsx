import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, CheckCircle, Clock, Upload, Shield, XCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";

export default function VerificationTab() {
  const { toast } = useToast();
  const [documentType, setDocumentType] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [showResubmitForm, setShowResubmitForm] = useState(false);

  const { data: userData, isLoading, isError } = useQuery({
    queryKey: ["/api/auth/user"],
    queryFn: async () => {
      const res = await apiRequest("/api/auth/user", "GET");
      return res.json();
    },
    refetchInterval: 4000,        // 🔥 auto refresh every 4 seconds
    refetchOnWindowFocus: true,   // 🔥 refresh when page is focused
    staleTime: 0,
  });

  // Fetch verification status
  const { data: verificationData, refetch } = useQuery({
    queryKey: ["/api/verification/status"],
    queryFn: async () => {
      const res = await fetch("/api/verification/status", { credentials: "include" });
      return res.json();
    },
  });

  const { data: canWithdrawData } = useQuery({
    queryKey: ["/api/verification/can-withdraw"],
    queryFn: async () => {
      const res = await fetch("/api/verification/can-withdraw", { credentials: "include" });
      return res.json();
    },
  });

  // Single mutation that handles both upload and submission
  const submitVerificationMutation = useMutation({
    mutationFn: async () => {
      if (!imageFile || !documentType) {
        throw new Error("Please select document type and upload image");
      }

      const formData = new FormData();
      formData.append("documentImage", imageFile);
      formData.append("documentType", documentType);

      const res = await fetch("/api/verification/submit", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to submit verification");
      }

      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Verification Submitted",
        description: "Your ID has been submitted for review. Please check back shortly.",
      });
      refetch();
      setImageFile(null);
      setImagePreview(null);
      setDocumentType("");
      setShowResubmitForm(false);
    },
    onError: (error: any) => {
      toast({
        title: "Submission Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ["image/jpeg", "image/png", "image/jpg"];
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Invalid File Type",
        description: "Please upload a JPEG or PNG image",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 20MB - matching your backend limit)
    if (file.size > 20 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please upload an image smaller than 20MB",
        variant: "destructive",
      });
      return;
    }

    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!documentType) {
      toast({
        title: "Document Type Required",
        description: "Please select a document type",
        variant: "destructive",
      });
      return;
    }

    if (!imageFile) {
      toast({
        title: "Image Required",
        description: "Please upload an image of your ID",
        variant: "destructive",
      });
      return;
    }

    await submitVerificationMutation.mutateAsync();
  };

  const verification = verificationData?.verification;
  const isVerified = verificationData?.isVerified;
  const canWithdraw = canWithdrawData?.canWithdraw;

  
const calculateAge = (birthDate: string | Date | null): number | null => {
  if (!birthDate) return null;
  const birth = new Date(birthDate);
  if (isNaN(birth.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
};

  const getStatusBadge = () => {
    if (!verification) return null;
    
    switch (verification.status) {
      case "pending":
        return (
          <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30">
            <Clock className="w-3 h-3 mr-1" />
            Pending Review
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

  // If user is verified, show success state
  if (isVerified) {
    return (
      <Card className="bg-gradient-to-br from-green-900/20 to-green-950/20 border-green-500/30">
        <CardHeader>
          <CardTitle className="text-green-400 flex items-center gap-2">
            <Shield className="w-6 h-6" />
            Account Verified
          </CardTitle>
          <CardDescription>
            Your account has been successfully verified. You can now make withdrawals.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-center p-6">
            <div className="text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <p className="text-lg font-semibold text-green-400">
                Verification Complete
              </p>
              <p className="text-sm text-gray-400 mt-2">
                Your ID has been approved. Withdrawals are now enabled.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // If verification is pending, show pending state
  if (verification?.status === "pending") {
    return (
      <Card className="bg-gradient-to-br from-yellow-900/20 to-yellow-950/20 border-yellow-500/30">
        <CardHeader>
          <CardTitle className="text-yellow-400 flex items-center gap-2">
            <Clock className="w-6 h-6" />
            Verification Pending
          </CardTitle>
          <CardDescription>
            Your ID is under review. Please check back shortly.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            {getStatusBadge()}
            <span className="text-sm text-gray-400">
              Submitted on {new Date(verification.createdAt).toLocaleDateString()}
            </span>
          </div>
          
          <Alert className="bg-yellow-500/10 border-yellow-500/30">
            <AlertCircle className="w-4 h-4 text-yellow-500" />
            <AlertDescription className="text-yellow-400">
              Please wait while we review your documents. This usually takes 24-48 hours.
            </AlertDescription>
          </Alert>

          <div className="bg-black/30 p-4 rounded-lg">
            <h4 className="font-semibold text-white mb-2">Document Submitted:</h4>
            <p className="text-sm text-gray-400 capitalize">{verification.documentType.replace("_", " ")}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // If verification was rejected and user wants to resubmit, show form
  if (verification?.status === "rejected" && showResubmitForm) {
    return (
      <Card className="bg-gradient-to-br from-zinc-900 to-zinc-950 border-yellow-500/20">
        <CardHeader>
          <CardTitle className="text-yellow-400 flex items-center gap-2">
            <Shield className="w-6 h-6" />
            Submit New Verification
          </CardTitle>
          <CardDescription>
            Your previous verification was rejected. Please submit new documents.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Show rejection reason from previous submission */}
          {verification.adminNotes && (
            <Alert className="bg-red-500/10 border-red-500/30">
              <AlertCircle className="w-4 h-4 text-red-500" />
              <AlertDescription className="text-red-400">
                <strong>Previous Rejection Reason:</strong> {verification.adminNotes}
              </AlertDescription>
            </Alert>
          )}

          <Alert className="bg-yellow-500/10 border-yellow-500/30">
            <AlertCircle className="w-4 h-4 text-yellow-500" />
            <AlertDescription className="text-yellow-400">
              Please ensure your new submission addresses the issues mentioned above.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="documentType" className="text-white">
                Document Type *
              </Label>
              <Select value={documentType} onValueChange={setDocumentType}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700">
                  <SelectValue placeholder="Select document type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="passport">Passport</SelectItem>
                  <SelectItem value="driving_license">Driving License</SelectItem>
                  <SelectItem value="travel_pass">Travel Pass</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-white">Upload ID Document *</Label>
              <div className="border-2 border-dashed border-yellow-500/30 rounded-lg p-6 text-center hover:border-yellow-500/50 transition-colors">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/jpg"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="id-upload"
                />
                <label htmlFor="id-upload" className="cursor-pointer">
                  {imagePreview ? (
                    <div className="space-y-2">
                      <img
                        src={imagePreview}
                        alt="ID Preview"
                        className="mx-auto max-h-48 rounded-lg object-contain"
                      />
                      <p className="text-sm text-green-400">Click to change image</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Upload className="w-12 h-12 text-yellow-500 mx-auto" />
                      <p className="text-sm text-gray-400">
                        Click to upload ID image (JPEG/PNG, max 20MB)
                      </p>
                      <p className="text-xs text-gray-500">
                        Ensure the ID is clear and all details are readable
                      </p>
                    </div>
                  )}
                </label>
              </div>
            </div>

            <div className="bg-black/30 p-4 rounded-lg">
              <h4 className="font-semibold text-white mb-2">Requirements:</h4>
              <ul className="text-sm text-gray-400 list-disc pl-4 space-y-1">
                <li>Government-issued photo ID</li>
                <li>Clear, color image of the entire document</li>
                <li>All text must be readable</li>
                <li>Document must not be expired</li>
                <li>Name and date of birth must match your account</li>
              </ul>
            </div>
            <Alert className="bg-blue-500/10 border-blue-500/30">
            <AlertCircle className="w-4 h-4 text-blue-400" />
            <AlertDescription className="text-blue-300 text-sm">
              If you cannot provide ID for verification, please contact Support to discuss alternative verification methods.
            </AlertDescription>
          </Alert>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowResubmitForm(false)}
                className="flex-1 border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!documentType || !imageFile || submitVerificationMutation.isPending}
                className="flex-1 bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-black font-bold"
              >
                {submitVerificationMutation.isPending ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="animate-spin w-4 h-4 border-2 border-black border-t-transparent rounded-full" />
                    Submitting...
                  </span>
                ) : (
                  "Submit New Verification"
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // If verification was rejected, show rejection state with option to resubmit
  if (verification?.status === "rejected") {
    return (
      <Card className="bg-gradient-to-br from-red-900/20 to-red-950/20 border-red-500/30">
        <CardHeader>
          <CardTitle className="text-red-400 flex items-center gap-2">
            <XCircle className="w-6 h-6" />
            Verification Rejected
          </CardTitle>
          <CardDescription>
            We were unable to verify your identity. Please try again.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
           {/* Show account DOB and age */}
      <div className="bg-black/30 p-4 rounded-lg">
        <h4 className="font-semibold text-white mb-2">Your Account Details:</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">Date of Birth:</span>
            <span className="text-white">
              {userData?.dateOfBirth 
                ? format(new Date(userData.dateOfBirth), "dd MMM yyyy")
                : "Not provided"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Age:</span>
            <span className="text-white">
              {userData?.dateOfBirth 
                ? `${calculateAge(userData.dateOfBirth)} years`
                : "Unknown"}
            </span>
          </div>
        </div>
      </div>
          <div className="flex items-center justify-between">
            {getStatusBadge()}
            <span className="text-sm text-gray-400">
              Reviewed on {new Date(verification.reviewedAt).toLocaleDateString()}
            </span>
          </div>
          
          <Alert className="bg-red-500/10 border-red-500/30">
            <AlertCircle className="w-4 h-4 text-red-500" />
            <AlertDescription className="text-red-400">
              {verification.adminNotes || "Your verification was rejected. Please ensure your ID is clear and matches your account details."}
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <div className="bg-black/30 p-4 rounded-lg">
              <h4 className="font-semibold text-white mb-2">Common Reasons for Rejection:</h4>
              <ul className="text-sm text-gray-400 list-disc pl-4 space-y-1">
                <li>Blurry or unreadable ID image</li>
                <li>Expired ID document</li>
                <li>Name doesn't match account details</li>
                <li>Date of birth doesn't match</li>
                <li>ID is not government-issued</li>
              </ul>
            </div>
            
            <Button 
              onClick={() => setShowResubmitForm(true)}
              className="w-full bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-black font-bold"
            >
              Submit New Verification
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // No verification submitted yet (first time user)
  return (
    <Card className="bg-gradient-to-br from-zinc-900 to-zinc-950 border-yellow-500/20">
      <CardHeader>
        <CardTitle className="text-yellow-400 flex items-center gap-2">
          <Shield className="w-6 h-6" />
          Identity Verification Required
        </CardTitle>
        <CardDescription>
          Complete ID verification to enable withdrawals
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert className="bg-yellow-500/10 border-yellow-500/30">
          <AlertCircle className="w-4 h-4 text-yellow-500" />
          <AlertDescription className="text-yellow-400">
            The verification will fail if the account details do not match the ID submitted.
            Withdrawals will not be processed if the verification process fails.
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="documentType" className="text-white">
              Document Type *
            </Label>
            <Select value={documentType} onValueChange={setDocumentType}>
              <SelectTrigger className="bg-zinc-800 border-zinc-700">
                <SelectValue placeholder="Select document type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="passport">Passport</SelectItem>
                <SelectItem value="driving_license">Driving License</SelectItem>
                <SelectItem value="travel_pass">Travel Pass</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-white">Upload ID Document *</Label>
            <div className="border-2 border-dashed border-yellow-500/30 rounded-lg p-6 text-center hover:border-yellow-500/50 transition-colors">
              <input
                type="file"
                accept="image/jpeg,image/png,image/jpg"
                onChange={handleImageUpload}
                className="hidden"
                id="id-upload"
              />
              <label htmlFor="id-upload" className="cursor-pointer">
                {imagePreview ? (
                  <div className="space-y-2">
                    <img
                      src={imagePreview}
                      alt="ID Preview"
                      className="mx-auto max-h-48 rounded-lg object-contain"
                    />
                    <p className="text-sm text-green-400">Click to change image</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="w-12 h-12 text-yellow-500 mx-auto" />
                    <p className="text-sm text-gray-400">
                      Click to upload ID image (JPEG/PNG, max 20MB)
                    </p>
                    <p className="text-xs text-gray-500">
                      Ensure the ID is clear and all details are readable
                    </p>
                  </div>
                )}
              </label>
            </div>
          </div>

          <div className="bg-black/30 p-4 rounded-lg">
            <h4 className="font-semibold text-white mb-2">Requirements:</h4>
            <ul className="text-sm text-gray-400 list-disc pl-4 space-y-1">
              <li>Government-issued photo ID</li>
              <li>Clear, color image of the entire document</li>
              <li>All text must be readable</li>
              <li>Document must not be expired</li>
              <li>Name and date of birth must match your account</li>
            </ul>
          </div>
          <Alert className="bg-blue-500/10 border-blue-500/30">
          <AlertCircle className="w-4 h-4 text-blue-400" />
          <AlertDescription className="text-blue-300 text-sm">
            If you cannot provide ID for verification, please contact Support to discuss alternative verification methods.
          </AlertDescription>
        </Alert>

          <Button
            onClick={handleSubmit}
            disabled={!documentType || !imageFile || submitVerificationMutation.isPending}
            className="w-full bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-black font-bold py-6"
          >
            {submitVerificationMutation.isPending ? (
              <span className="flex items-center gap-2">
                <div className="animate-spin w-4 h-4 border-2 border-black border-t-transparent rounded-full" />
                Submitting...
              </span>
            ) : (
              "Submit for Verification"
            )}
          </Button>

          <p className="text-xs text-center text-gray-500">
            By submitting, you confirm that the information provided is accurate.
            Verification typically takes 24-48 hours.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}