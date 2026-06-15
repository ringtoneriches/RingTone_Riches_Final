import AdminLayout from "@/components/admin/admin-layout";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, ArrowLeft, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import { ChevronsUpDown, Check, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface WinnerFormData {
  userId: string;
  competitionId: string;
  prizeDescription: string;
  prizeValue: string;
  imageUrl: string;
  isShowcase: boolean;
}

interface WinnerPayload {
  userId: string;
  competitionId: string | null;
  prizeDescription: string;
  prizeValue: string;
  imageUrl: string | null;
  isShowcase?: boolean;
}

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface Competition {
  id: string;
  title: string;
}

export default function AdminAddWinner() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [openUserSelect, setOpenUserSelect] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [form, setForm] = useState<WinnerFormData>({
    userId: "",
    competitionId: "",
    prizeDescription: "",
    prizeValue: "",
    imageUrl: "",
    isShowcase: true, // Default to showing in showcase
  });

  // Fetch users for selection
  const { data: usersResponse, isLoading: isLoadingUsers } = useQuery<{ users: User[], pagination: any }>({
  queryKey: ["/api/admin/users"],
  queryFn: async () => {
    const url = new URL("/api/admin/users", window.location.origin);
    url.searchParams.append("limit", "9999"); // Fetch all users for dropdown
    const res = await fetch(url.toString());
    return res.json();
  },
});

const users = usersResponse?.users || [];

  // Fetch competitions for selection
  const { data: competitions = [], isLoading: isLoadingCompetitions } = useQuery<Competition[]>({
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
    if (!form.userId || !form.prizeDescription || !form.prizeValue) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please fill in all required fields",
      });
      return;
    }

    setSaving(true);
    try {
      const payload: WinnerPayload = {
        ...form,
        competitionId: form.competitionId || null,
        imageUrl: form.imageUrl || null,
        isShowcase: form.isShowcase,
      };

      await apiRequest("/api/admin/winners", "POST", payload);
      
      queryClient.invalidateQueries({ queryKey: ["/api/admin/winners"] });
      queryClient.invalidateQueries({ queryKey: ["/api/winners"] });
      
      toast({
        title: "Success",
        description: "Winner added successfully",
      });
      
      // Reset form
      setForm({
        userId: "",
        competitionId: "",
        prizeDescription: "",
        prizeValue: "",
        imageUrl: "",
        isShowcase: true,
      });
      
      // Navigate back to winners list
      setLocation("/admin/past-winners");
    } catch (error: any) {
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
            {/* Winner Selection Section */}
            <div>
              <h2 className="text-lg font-semibold mb-4">Winner Details</h2>
              <div className="space-y-4">
                {/* User Selection */}
                <div>
                  <Label className="text-sm font-medium">
                    Select Winner <span className="text-red-500">*</span>
                  </Label>
                  <p className="text-xs text-muted-foreground mb-2">
                    Choose the user who won
                  </p>
                  <Popover open={openUserSelect} onOpenChange={setOpenUserSelect}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={openUserSelect}
                        className="w-full justify-between"
                      >
                        {form.userId
                          ? users.find((u) => u.id === form.userId)?.firstName +
                            " " +
                            users.find((u) => u.id === form.userId)?.lastName
                          : "Select a user..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[400px] p-0">
                      <Command>
                        <CommandInput placeholder="Search user by name or email..." />
                        <CommandEmpty>
                          {isLoadingUsers ? "Loading users..." : "No user found."}
                        </CommandEmpty>
                        <CommandGroup className="max-h-64 overflow-y-auto">
                          {users.map((user) => (
                            <CommandItem
                              key={user.id}
                              value={`${user.firstName} ${user.lastName} ${user.email}`}
                              onSelect={() => {
                                setForm({ ...form, userId: user.id });
                                setOpenUserSelect(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  form.userId === user.id ? "opacity-100" : "opacity-0"
                                )}
                              />
                              <div className="flex flex-col">
                                <span className="font-medium">
                                  {user.firstName} {user.lastName}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {user.email}
                                </span>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Competition Selection */}
                <div>
                  <Label className="text-sm font-medium">
                    Competition
                    <span className="text-muted-foreground font-normal ml-2">(Optional)</span>
                  </Label>
                  <p className="text-xs text-muted-foreground mb-2">
                    Link this win to a specific competition
                  </p>
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
                  <Label className="text-sm font-medium">
                    Prize Description <span className="text-red-500">*</span>
                  </Label>
                  <p className="text-xs text-muted-foreground mb-2">
                    Describe what the winner won
                  </p>
                  <Textarea
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
                  <Label className="text-sm font-medium">
                    Prize Value <span className="text-red-500">*</span>
                  </Label>
                  <p className="text-xs text-muted-foreground mb-2">
                    The value of the prize (e.g., £50,000 or 10,000 Ringtones)
                  </p>
                  <Input
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
                  <p className="text-xs text-muted-foreground mb-2">
                    Upload an image of the prize or enter a URL
                  </p>
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
                disabled={saving || !form.userId || !form.prizeDescription || !form.prizeValue}
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