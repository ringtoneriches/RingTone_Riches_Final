import AdminLayout from "@/components/admin/admin-layout";
import { useQuery } from "@tanstack/react-query";
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, Save, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface WinnerFormData {
  firstName: string;
  lastName: string;
  competitionId: string;
  prizeDescription: string;
  prizeValue: string;
  imageUrl: string;
  isShowcase: boolean;
}

interface Competition {
  id: string;
  title: string;
}

export default function AdminAddWinner() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [form, setForm] = useState<WinnerFormData>({
    firstName: "",
    lastName: "",
    competitionId: "",
    prizeDescription: "",
    prizeValue: "",
    imageUrl: "",
    isShowcase: true,
  });

  // Fetch competitions for selection
  const { data: competitions = [] } = useQuery<Competition[]>({
    queryKey: ["/api/competitions"],
  });

  const handleImageUpload = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("image", file);

      const response = await fetch("/api/upload/competition-image", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Upload failed");
      }

      const { imagePath } = await response.json();
      setForm({ ...form, imageUrl: imagePath });
      toast({
        title: "Success",
        description: "Image uploaded successfully",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: error.message,
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    // Trim values
    const firstName = form.firstName.trim();
    const lastName = form.lastName.trim();
    const prizeDescription = form.prizeDescription.trim();
    const prizeValue = form.prizeValue.trim();

    if (!firstName || !lastName || !prizeDescription || !prizeValue) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please fill in all required fields (First Name, Last Name, Prize Description, and Prize Value)",
      });
      return;
    }

    setSaving(true);
    try {
      // Create winner with firstName and lastName directly
      const payload = {
        firstName,
        lastName,
        competitionId: form.competitionId || null,
        prizeDescription,
        prizeValue,
        imageUrl: form.imageUrl || null,
      };

      console.log("Creating winner with payload:", payload);

      const response = await fetch("/api/admin/winners", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to add winner");
      }
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/admin/winners"] });
      queryClient.invalidateQueries({ queryKey: ["/api/winners"] });
      
      toast({
        title: "Success",
        description: `Winner ${firstName} ${lastName} added successfully`,
      });
      
      // Reset form
      setForm({
        firstName: "",
        lastName: "",
        competitionId: "",
        prizeDescription: "",
        prizeValue: "",
        imageUrl: "",
        isShowcase: true,
      });
      
      // Navigate back to winners list
      setLocation("/admin/past-winners");
    } catch (error: any) {
      console.error("Error adding winner:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to add winner",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto space-y-6 p-4 sm:p-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Add New Winner</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Add a winner to display in the showcase
            </p>
          </div>
        </div>

        <Separator />

        {/* Main Form Card */}
        <Card className="p-6">
          <div className="space-y-6">
            {/* Winner Details Section */}
            <div>
              <h2 className="text-lg font-semibold mb-4">Winner Details</h2>
              <div className="space-y-4">
                {/* First Name */}
                <div>
                  <Label htmlFor="firstName" className="text-sm font-medium">
                    First Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="firstName"
                    value={form.firstName}
                    onChange={(e) =>
                      setForm({ ...form, firstName: e.target.value })
                    }
                    placeholder="e.g., John"
                  />
                </div>

                {/* Last Name */}
                <div>
                  <Label htmlFor="lastName" className="text-sm font-medium">
                    Last Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="lastName"
                    value={form.lastName}
                    onChange={(e) =>
                      setForm({ ...form, lastName: e.target.value })
                    }
                    placeholder="e.g., Smith"
                  />
                </div>

                {/* Competition Selection */}
                <div>
                  <Label className="text-sm font-medium">
                    Competition
                    <span className="text-muted-foreground font-normal ml-2">(Optional)</span>
                  </Label>
                  <Select
                    value={form.competitionId || "none"}
                    onValueChange={(value) =>
                      setForm({ ...form, competitionId: value === "none" ? "" : value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a competition" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None (Manual Entry)</SelectItem>
                      {competitions.map((comp) => (
                        <SelectItem key={comp.id} value={comp.id}>
                          {comp.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <Separator />

            {/* Prize Details Section */}
            <div>
              <h2 className="text-lg font-semibold mb-4">Prize Details</h2>
              <div className="space-y-4">
                {/* Prize Description */}
                <div>
                  <Label htmlFor="prizeDescription" className="text-sm font-medium">
                    Prize Description <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="prizeDescription"
                    value={form.prizeDescription}
                    onChange={(e) =>
                      setForm({ ...form, prizeDescription: e.target.value })
                    }
                    placeholder="e.g., BMW M4 Competition, £5000 Cash Prize, iPhone 15 Pro"
                    rows={3}
                  />
                </div>

                {/* Prize Value */}
                <div>
                  <Label htmlFor="prizeValue" className="text-sm font-medium">
                    Prize Value <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="prizeValue"
                    value={form.prizeValue}
                    onChange={(e) =>
                      setForm({ ...form, prizeValue: e.target.value })
                    }
                    placeholder="e.g., £50,000, 10,000 Ringtones"
                  />
                </div>

                {/* Prize Image */}
                <div>
                  <Label className="text-sm font-medium">Prize Image</Label>
                  <div className="space-y-3">
                    <Input
                      value={form.imageUrl}
                      onChange={(e) =>
                        setForm({ ...form, imageUrl: e.target.value })
                      }
                      placeholder="Enter image URL or upload below"
                    />
                    <div className="flex items-center gap-3">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleImageUpload(file);
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        {uploading ? "Uploading..." : "Upload Image"}
                      </Button>
                      {form.imageUrl && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setForm({ ...form, imageUrl: "" })}
                          className="text-red-500 hover:text-red-600"
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                    {form.imageUrl && (
                      <div className="mt-2">
                        <img
                          src={form.imageUrl}
                          alt="Prize preview"
                          className="max-w-xs h-32 object-contain rounded border"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Showcase Settings */}
            <div>
              <h2 className="text-lg font-semibold mb-4">Display Settings</h2>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-blue-900">
                      New winners are automatically shown in the showcase
                    </p>
                    <p className="text-xs text-blue-700 mt-1">
                      You can hide individual winners later from the Past Winners management page.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setLocation("/admin/past-winners")}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={saving || !form.firstName.trim() || !form.lastName.trim() || !form.prizeDescription.trim() || !form.prizeValue.trim()}
                className="flex-1"
                size="lg"
              >
                {saving ? (
                  <>
                    <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Add Winner
                  </>
                )}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </AdminLayout>
  );
}