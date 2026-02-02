import AdminLayout from "@/components/admin/admin-layout";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2, Trophy, Upload, Settings, Archive, ArchiveRestore } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Competition } from "@shared/schema";
import WinnerDrawDialog from "@/components/admin/winner-draw-dialog";
import PrizeConfigSpin, {
  SpinPrizeData,
} from "@/components/admin/prize-config-spin";
import PrizeConfigScratch, {
  ScratchPrizeData,
} from "@/components/admin/prize-config-scratch";
import PrizeConfigInstant, {
  InstantPrizeData,
} from "@/components/admin/prize-config-instant";
import { Textarea } from "@/components/ui/textarea";

interface CompetitionFormData {
  title: string;
  description: string;
  imageUrl: string;
  type: "spin" | "scratch" | "instant";
  ticketPrice: string;
  maxTickets: string;
  ringtonePoints: string;
  endDate?: string;
  prizeData?: SpinPrizeData | ScratchPrizeData | InstantPrizeData;
}

function CompetitionForm({
  data,
  onSubmit,
  onCancel,
  isLoading,
  fixedType,
}: {
  data?: Competition;
  onSubmit: (formData: CompetitionFormData) => void;
  onCancel: () => void;
  isLoading: boolean;
  fixedType?: "spin" | "scratch" | "instant";
}) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState<CompetitionFormData>({
    title: data?.title || "",
    description: data?.description || "",
    imageUrl: data?.imageUrl || "",
    type: fixedType || data?.type || "instant",
    ticketPrice: data?.ticketPrice || "0.99",
    maxTickets: data?.maxTickets?.toString() || "",
    ringtonePoints: data?.ringtonePoints?.toString() || "0",
    endDate: data?.endDate
      ? new Date(data.endDate).toISOString().slice(0, 16)
      : "",
    prizeData: data?.prizeData as any,
  });
  const [uploading, setUploading] = useState(false);

  const handlePrizeDataChange = (
    prizeData: SpinPrizeData | ScratchPrizeData | InstantPrizeData,
  ) => {
    setForm({ ...form, prizeData });
  };

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

  return (
    <Tabs defaultValue="basic" className="w-full">
      <TabsList className="grid w-full grid-cols-2 h-auto">
        <TabsTrigger
          value="basic"
          data-testid="tab-basic"
          className="text-xs sm:text-sm py-2 sm:py-2.5"
        >
          Basic Info
        </TabsTrigger>
        <TabsTrigger
          value="prizes"
          data-testid="tab-prizes"
          className="text-xs sm:text-sm py-2 sm:py-2.5"
        >
          Prize Configuration
        </TabsTrigger>
      </TabsList>

      <TabsContent
        value="basic"
        className="space-y-4 mt-4 max-h-[60vh] sm:max-h-[60vh] overflow-y-auto pr-1 sm:pr-2"
      >
        <div>
          <Label>Title</Label>
          <Input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Competition title"
          />
        </div>

        <div>
          <Label>Description</Label>
          <Textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Competition description"
            rows={5}
          />
        </div>

        <div>
          <Label>Competition Image</Label>
          <div className="space-y-2">
            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    handleImageUpload(file);
                    if (fileInputRef.current) {
                      fileInputRef.current.value = "";
                    }
                  }
                }}
                disabled={uploading}
                className="hidden"
                data-testid="input-image-upload"
              />
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
                data-testid="button-select-image"
              >
                <Upload className="h-4 w-4 mr-2" />
                {uploading ? "Uploading..." : "Select Image"}
              </Button>
            </div>
            {form.imageUrl && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <img
                  src={form.imageUrl}
                  alt="Preview"
                  className="h-20 w-20 object-cover rounded border"
                />
                <span className="truncate">{form.imageUrl.split("/").slice(-1)[0]}</span>
              </div>
            )}
          </div>
        </div>

        {!fixedType && (
          <div>
            <Label>Type</Label>
            <select
              className="w-full p-2 border border-border rounded-md bg-background text-foreground"
              value={form.type}
              onChange={(e) =>
                setForm({
                  ...form,
                  type: e.target.value as "spin" | "scratch" | "instant",
                })
              }
              data-testid="select-type"
            >
              <option value="instant">Regular Competition</option>
              <option value="spin">Spin Wheel</option>
              <option value="scratch">Scratch Card</option>
            </select>
          </div>
        )}
        {fixedType && (
          <div>
            <Label>Type</Label>
            <div className="w-full p-2 border border-border rounded-md bg-muted text-foreground">
              {fixedType === "spin"
                ? "Spin Wheel"
                : fixedType === "scratch"
                  ? "Scratch Card"
                  : "Regular Competition"}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <div>
            <Label>Ticket Price (£)</Label>
            <Input
              type="number"
              step="0.01"
              value={form.ticketPrice}
              onChange={(e) =>
                setForm({ ...form, ticketPrice: e.target.value })
              }
              data-testid="input-ticketPrice"
            />
          </div>

          <div>
            <Label>Max Tickets</Label>
            <Input
              type="number"
              value={form.maxTickets}
              onChange={(e) => setForm({ ...form, maxTickets: e.target.value })}
              data-testid="input-maxTickets"
            />
          </div>

          <div>
            <Label>Ringtone Points</Label>
            <Input
              type="number"
              value={form.ringtonePoints}
              onChange={(e) =>
                setForm({ ...form, ringtonePoints: e.target.value })
              }
              data-testid="input-ringtonePoints"
            />
          </div>
        </div>

        <div>
          <Label>Competition End Date & Time (Optional)</Label>
          <Input
            type="datetime-local"
            value={form.endDate || ""}
            onChange={(e) => setForm({ ...form, endDate: e.target.value })}
            placeholder="Select end date and time"
            data-testid="input-endDate"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Leave empty to use the default countdown timer. Set to display a
            custom countdown on the competition page.
          </p>
        </div>
      </TabsContent>

      <TabsContent
        value="prizes"
        className="mt-4 max-h-[60vh] sm:max-h-[60vh] overflow-y-auto pr-1 sm:pr-2"
      >
        {form.type === "spin" && (
          <PrizeConfigSpin
            initialData={form.prizeData as SpinPrizeData}
            onSave={handlePrizeDataChange}
            isLoading={isLoading}
          />
        )}
        {form.type === "scratch" && (
          <PrizeConfigScratch
            initialData={form.prizeData as ScratchPrizeData}
            onSave={handlePrizeDataChange}
            isLoading={isLoading}
          />
        )}
        {form.type === "instant" && (
          <PrizeConfigInstant
            initialData={form.prizeData as InstantPrizeData}
            onSave={handlePrizeDataChange}
            isLoading={isLoading}
          />
        )}
      </TabsContent>

      <DialogFooter className="mt-6">
        <Button
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
          data-testid="button-cancel"
        >
          Cancel
        </Button>
        <Button
          onClick={() => onSubmit(form)}
          disabled={isLoading}
          data-testid="button-save"
        >
          {isLoading ? "Saving..." : "Save Competition"}
        </Button>
      </DialogFooter>
    </Tabs>
  );
}

// Scratch Card Settings Dialog
function ScratchSettingsDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { toast } = useToast();
  const [isVisible, setIsVisible] = useState<boolean>(true);

  const { data: config } = useQuery<{ isVisible: boolean }>({
    queryKey: ["/api/admin/game-scratch-config"],
  });

  // Set initial state from config when it loads
  useEffect(() => {
    if (config) {
      setIsVisible(config.isVisible ?? true);
    }
  }, [config]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("/api/admin/game-scratch-config", "PUT", {
        isVisible,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/admin/game-scratch-config"],
      });
      queryClient.invalidateQueries({ queryKey: ["/api/competitions"] });
      onOpenChange(false);
      toast({ title: "Settings saved successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to save settings",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Scratch Card Settings</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Visibility Toggle */}
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">
                Show Scratch Card on Frontend
              </Label>
              <p className="text-xs text-muted-foreground">
                Hide the scratch card on the frontend while you adjust settings
              </p>
            </div>
            <Switch
              checked={isVisible}
              onCheckedChange={setIsVisible}
              data-testid="switch-scratch-visible"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saveMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            data-testid="button-save-scratch-settings"
          >
            {saveMutation.isPending ? "Saving..." : "Save Settings"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function AdminScratchCard() {
  const { toast } = useToast();
  const [editingCompetition, setEditingCompetition] =
    useState<Competition | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [archiveConfirm, setArchiveConfirm] = useState<string | null>(null);
  const [unarchiveConfirm, setUnarchiveConfirm] = useState<string | null>(null);
  const [drawWinnerCompetition, setDrawWinnerCompetition] =
    useState<Competition | null>(null);
  const [scratchSettingsOpen, setScratchSettingsOpen] = useState(false);
  const [showArchivedModal, setShowArchivedModal] = useState(false);

  const { data: allCompetitions, isLoading } = useQuery<Competition[]>({
    queryKey: ["/api/admin/competitions"],
  });

  // Filter competitions by type and status
  const competitions = allCompetitions?.filter((c) => c.type === "scratch") || [];
  const activeCompetitions = competitions.filter((c) => c.isActive);
  const archivedCompetitions = competitions.filter((c) => !c.isActive);

  const createMutation = useMutation({
    mutationFn: async (formData: CompetitionFormData) => {
      const payload: any = {
        ...formData,
        ticketPrice: parseFloat(formData.ticketPrice).toFixed(2),
        maxTickets: parseInt(formData.maxTickets),
        ringtonePoints: parseInt(formData.ringtonePoints),
      };

      // Convert datetime-local to ISO timestamp if provided
      if (formData.endDate) {
        payload.endDate = new Date(formData.endDate).toISOString();
      }

      const res = await apiRequest("/api/admin/competitions", "POST", payload);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/competitions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/competitions"] });
      setCreateDialogOpen(false);
      toast({ title: "Competition created successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create competition",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: CompetitionFormData;
    }) => {
      const payload: any = {
        ...data,
        ticketPrice: parseFloat(data.ticketPrice).toFixed(2),
        maxTickets: parseInt(data.maxTickets),
        ringtonePoints: parseInt(data.ringtonePoints),
      };

      // Convert datetime-local to ISO timestamp if provided
      if (data.endDate) {
        payload.endDate = new Date(data.endDate).toISOString();
      }

      const res = await apiRequest(
        `/api/admin/competitions/${id}`,
        "PUT",
        payload,
      );
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/competitions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/competitions"] });
      setEditingCompetition(null);
      toast({ title: "Competition updated successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update competition",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const archiveMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest(`/api/admin/competitions/${id}/archive`, "POST");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/competitions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/competitions"] });
      setArchiveConfirm(null);
      toast({ title: "Scratch Card competition archived successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to archive competition",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const unarchiveMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest(`/api/admin/competitions/${id}/unarchive`, "POST");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/competitions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/competitions"] });
      setUnarchiveConfirm(null);
      toast({ title: "Scratch Card competition unarchived successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to unarchive competition",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateDisplayOrderMutation = useMutation({
    mutationFn: async ({
      id,
      displayOrder,
    }: {
      id: string;
      displayOrder: number;
    }) => {
      const res = await apiRequest(
        `/api/admin/competitions/${id}/display-order`,
        "PATCH",
        {
          displayOrder,
        },
      );
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/competitions"] });
      toast({ title: "Display order updated successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update display order",
        description: error.message,
        variant: "destructive",
      });
    },
  });

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
      <div className="space-y-4 md:space-y-6">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h1
              className="text-2xl md:text-3xl font-bold text-foreground"
              data-testid="heading-scratch-card"
            >
              Scratch Card Competitions
            </h1>
            <p className="text-sm md:text-base text-muted-foreground mt-1">
              Manage your scratch card competitions
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2">
            {/* View Archived Button - Top Right */}
            {archivedCompetitions.length > 0 && (
              <Button
                variant="outline"
                onClick={() => setShowArchivedModal(true)}
                className="gap-2"
                data-testid="button-view-archived"
              >
                <Archive className="w-4 h-4" />
                View Archived ({archivedCompetitions.length})
              </Button>
            )}
            
            <Button
              onClick={() => setScratchSettingsOpen(true)}
              variant="outline"
              className="gap-2"
              data-testid="button-scratch-settings"
            >
              <Settings className="w-4 h-4" />
              Scratch Settings
            </Button>
          </div>
        </div>

        {/* Active Competitions Section */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Active Scratch Card Competitions</h2>
          <div className="grid gap-4">
            {activeCompetitions.length === 0 ? (
              <div className="text-center py-12 border border-dashed rounded-lg">
                <p className="text-muted-foreground mb-4">
                  No active scratch card competitions yet
                </p>
                {/* <Button onClick={() => setCreateDialogOpen(true)}>
                  Create Your First Scratch Card
                </Button> */}
              </div>
            ) : (
              activeCompetitions.map((competition) => (
                <div
                  key={competition.id}
                  className="bg-card border border-border rounded-lg p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-start flex-col sm:flex-row justify-between">
                    <div className="flex gap-4 flex-col sm:flex-row flex-1">
                      {competition.imageUrl && (
                        <img
                          src={competition.imageUrl}
                          alt={competition.title}
                          className="w-full h-98 sm:w-24 sm:h-24 object-cover rounded-lg"
                        />
                      )}
                      <div className="flex-1">
                        <div className="flex items-center flex-col gap-2 mb-2">
                          <h3 className="text-xl font-bold text-foreground">
                            {competition.title}
                          </h3>
                          <div>

                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-500">
                            SCRATCH CARD
                          </span>
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-500">
                            ACTIVE
                          </span>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mb-4">
                          {competition.description}
                        </p>
                        <div className="flex gap-6 text-sm">
                          <div>
                            <span className="text-muted-foreground">Price: </span>
                            <span className="font-medium text-primary">
                              £{parseFloat(competition.ticketPrice).toFixed(2)}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Sold: </span>
                            <span className="font-medium text-foreground">
                              {competition.soldTickets || 0} /{" "}
                              {competition.maxTickets}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Status: </span>
                            <span className="font-medium text-green-500">
                              Active
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-muted-foreground">
                            Display Order:{" "}
                          </span>
                          <Input
                            type="number"
                            min="0"
                            defaultValue={competition.displayOrder ?? 999}
                            onBlur={(e) => {
                              const parsedValue = parseInt(e.target.value);
                              const newOrder = isNaN(parsedValue)
                                ? 999
                                : parsedValue;
                              const currentOrder = competition.displayOrder ?? 999;
                              if (newOrder !== currentOrder) {
                                updateDisplayOrderMutation.mutate({
                                  id: competition.id,
                                  displayOrder: newOrder,
                                });
                              }
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                const parsedValue = parseInt(
                                  (e.target as HTMLInputElement).value,
                                );
                                const newOrder = isNaN(parsedValue)
                                  ? 999
                                  : parsedValue;
                                const currentOrder =
                                  competition.displayOrder ?? 999;
                                if (newOrder !== currentOrder) {
                                  updateDisplayOrderMutation.mutate({
                                    id: competition.id,
                                    displayOrder: newOrder,
                                  });
                                }
                                (e.target as HTMLInputElement).blur();
                              }
                            }}
                            className="w-24"
                            data-testid={`input-display-order-${competition.id}`}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex  gap-2">
                      {/* <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDrawWinnerCompetition(competition)}
                        className="text-primary hover:text-primary"
                        data-testid={`button-draw-${competition.id}`}
                      >
                        <Trophy className="w-4 h-4" />
                      </Button> */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingCompetition(competition)}
                        data-testid={`button-edit-${competition.id}`}
                        className="gap-1"
                      >
                        <Edit className="w-4 h-4" />
                        
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setArchiveConfirm(competition.id)}
                        className="gap-1 text-amber-500 hover:text-amber-600 hover:bg-amber-50"
                        data-testid={`button-archive-${competition.id}`}
                      >
                        <Archive className="w-4 h-4" />
                    
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Archived Games Modal */}
        <Dialog open={showArchivedModal} onOpenChange={setShowArchivedModal}>
          <DialogContent className="max-w-7xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Archive className="w-5 h-5" />
                Archived Scratch Card Competitions ({archivedCompetitions.length})
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              {archivedCompetitions.length === 0 ? (
                <div className="text-center py-8">
                  <Archive className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No archived scratch card competitions</p>
                </div>
              ) : (
                archivedCompetitions.map((competition) => (
                  <div
                    key={competition.id}
                    className="bg-card border border-border rounded-lg p-6 opacity-90"
                  >
                    <div className="flex items-start flex-col sm:flex-row justify-between">
                      <div className="flex gap-4  flex-col sm:flex-row flex-1">
                        {competition.imageUrl && (
                          <img
                            src={competition.imageUrl}
                            alt={competition.title}
                            className="w-98 h-98 sm:w-20 sm:h-20 object-cover rounded-lg"
                          />
                        )}
                        <div className="flex-1">
                          <div className="flex items-center flex-col sm:flex-row gap-2 mb-2">
                            <h3 className="text-lg font-bold text-foreground">
                              {competition.title}
                            </h3>
                            <div>

                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-500">
                              SCRATCH CARD
                            </span>
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-500/20 text-gray-500">
                              ARCHIVED
                            </span>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">
                            {competition.description}
                          </p>
                          <div className="flex flex-wrap gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">Price: </span>
                              <span className="font-medium text-primary">
                                £{parseFloat(competition.ticketPrice).toFixed(2)}
                              </span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Sold: </span>
                              <span className="font-medium text-foreground">
                                {competition.soldTickets || 0} /{" "}
                                {competition.maxTickets}
                              </span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Status: </span>
                              <span className="font-medium text-red-500">
                                Inactive (Archived)
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setUnarchiveConfirm(competition.id);
                          }}
                          className="gap-1 text-green-500 hover:text-green-600 hover:bg-green-50"
                          data-testid={`button-unarchive-modal-${competition.id}`}
                        >
                          <ArchiveRestore className="w-4 h-4" />
                          Unarchive
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowArchivedModal(false)}
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Scratch Card Competition</DialogTitle>
            </DialogHeader>
            <CompetitionForm
              fixedType="scratch"
              onSubmit={(data) =>
                createMutation.mutate({ ...data, type: "scratch" })
              }
              onCancel={() => setCreateDialogOpen(false)}
              isLoading={createMutation.isPending}
            />
          </DialogContent>
        </Dialog>

        <Dialog
          open={!!editingCompetition}
          onOpenChange={(open) => !open && setEditingCompetition(null)}
        >
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Scratch Card Competition</DialogTitle>
            </DialogHeader>
            {editingCompetition && (
              <CompetitionForm
                data={editingCompetition}
                fixedType="scratch"
                onSubmit={(data) =>
                  updateMutation.mutate({
                    id: editingCompetition.id,
                    data: { ...data, type: "scratch" },
                  })
                }
                onCancel={() => setEditingCompetition(null)}
                isLoading={updateMutation.isPending}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Archive Confirmation Dialog */}
        <Dialog
          open={!!archiveConfirm}
          onOpenChange={(open) => !open && setArchiveConfirm(null)}
        >
          <DialogContent className="w-[90vw] max-w-sm sm:max-w-md mx-auto">
            <DialogHeader>
              <DialogTitle>Archive Scratch Card Competition</DialogTitle>
            </DialogHeader>
            <p className="text-muted-foreground">
              Are you sure you want to archive this scratch card competition? Archived games will become inactive and won't be shown on the frontend.
            </p>
            <DialogFooter className="flex flex-col gap-2 sm:flex-row">
              <Button
                variant="outline"
                onClick={() => setArchiveConfirm(null)}
                disabled={archiveMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() =>
                  archiveConfirm && archiveMutation.mutate(archiveConfirm)
                }
                disabled={archiveMutation.isPending}
              >
                {archiveMutation.isPending ? "Archiving..." : "Archive"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Unarchive Confirmation Dialog */}
        <Dialog
          open={!!unarchiveConfirm}
          onOpenChange={(open) => !open && setUnarchiveConfirm(null)}
        >
          <DialogContent className="w-[90vw] max-w-sm sm:max-w-md mx-auto">
            <DialogHeader>
              <DialogTitle>Unarchive Scratch Card Competition</DialogTitle>
            </DialogHeader>
            <p className="text-muted-foreground">
              Are you sure you want to unarchive this scratch card competition? The game will become active and will be shown on the frontend.
            </p>
            <DialogFooter className="flex flex-col gap-2 sm:flex-row">
              <Button
                variant="outline"
                onClick={() => setUnarchiveConfirm(null)}
                disabled={unarchiveMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                variant="default"
                onClick={() =>
                  unarchiveConfirm && unarchiveMutation.mutate(unarchiveConfirm)
                }
                disabled={unarchiveMutation.isPending}
              >
                {unarchiveMutation.isPending ? "Unarchiving..." : "Unarchive"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {drawWinnerCompetition && (
          <WinnerDrawDialog
            competitionId={drawWinnerCompetition.id}
            competitionTitle={drawWinnerCompetition.title}
            open={!!drawWinnerCompetition}
            onOpenChange={(open) => !open && setDrawWinnerCompetition(null)}
          />
        )}

        <ScratchSettingsDialog
          open={scratchSettingsOpen}
          onOpenChange={setScratchSettingsOpen}
        />
      </div>
    </AdminLayout>
  );
}