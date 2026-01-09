// app/admin-spin-wheel.tsx (updated with archive functionality)
import AdminLayout from "@/components/admin/admin-layout";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2, Trophy, Upload, Settings, RefreshCw, Archive, ArchiveRestore } from "lucide-react";
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
  wheelType?: string;
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
    wheelType: data?.wheelType || "wheel1",
    endDate: data?.endDate ? new Date(data.endDate).toISOString().slice(0, 16) : "",
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
      <TabsList className="grid w-full grid-cols-1 h-auto">
        <TabsTrigger
          value="basic"
          data-testid="tab-basic"
          className="text-xs sm:text-sm py-2 sm:py-2.5"
        >
          Basic Info
        </TabsTrigger>
        {/* <TabsTrigger
          value="prizes"
          data-testid="tab-prizes"
          className="text-xs sm:text-sm py-2 sm:py-2.5"
        >
          Prize Configuration
        </TabsTrigger> */}
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
        <div>
          <Label>Wheel Type</Label>
          <select
            className="w-full p-2 border border-border rounded-md bg-background text-foreground"
            value={form.wheelType || "wheel1"}
            onChange={(e) => setForm({ ...form, wheelType: e.target.value })}
            data-testid="select-wheel-type"
          >
            <option value="wheel1">Car Wheel (Default)</option>
            <option value="wheel2">Retro Ringtone wheel</option>
          </select>
          <p className="text-xs text-muted-foreground mt-1">
            Choose which wheel design to use for this competition
          </p>
        </div>
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
            onChange={(e) => {
              setForm({ ...form, endDate: e.target.value });
            }}
            placeholder="Select end date and time"
            data-testid="input-endDate"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Leave empty to use the default countdown timer. Set to display a custom countdown on the competition page.
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

export default function AdminSpinWheel() {
  const { toast } = useToast();
  const [editingCompetition, setEditingCompetition] =
    useState<Competition | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [archiveConfirm, setArchiveConfirm] = useState<string | null>(null);
  const [unarchiveConfirm, setUnarchiveConfirm] = useState<string | null>(null);
  const [drawWinnerCompetition, setDrawWinnerCompetition] =
    useState<Competition | null>(null);
  const [wheelSettingsOpen, setWheelSettingsOpen] = useState(false);
  const [wheel2SettingsOpen, setWheel2SettingsOpen] = useState(false);
  const [showArchivedModal, setShowArchivedModal] = useState(false);

  const { data: allCompetitions, isLoading } = useQuery<Competition[]>({
    queryKey: ["/api/admin/competitions"],
  });

  // Filter competitions by type and status
  const competitions = allCompetitions?.filter((c) => c.type === "spin") || [];
  const activeCompetitions = competitions.filter((c) => c.isActive);
  const archivedCompetitions = competitions.filter((c) => !c.isActive);

  const createMutation = useMutation({
    mutationFn: async (formData: CompetitionFormData) => {
      const payload: any = {
        ...formData,
        ticketPrice: parseFloat(formData.ticketPrice).toFixed(2),
        maxTickets: parseInt(formData.maxTickets),
        ringtonePoints: parseInt(formData.ringtonePoints),
        wheelType: formData.wheelType || "wheel1",
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
        wheelType: data.wheelType || "wheel1",
      };
      
      // Convert datetime-local to ISO timestamp if provided
      if (data.endDate) {
        payload.endDate = new Date(data.endDate).toISOString();
      }
      
      const res = await apiRequest(`/api/admin/competitions/${id}`, "PUT", payload);
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
      toast({ title: "Spin Wheel competition archived successfully" });
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
      toast({ title: "Spin Wheel competition unarchived successfully" });
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
    mutationFn: async ({ id, displayOrder }: { id: string; displayOrder: number }) => {
      const res = await apiRequest(`/api/admin/competitions/${id}/display-order`, "PATCH", {
        displayOrder,
      });
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
              data-testid="heading-spin-wheel"
            >
              Spin Wheel Competitions
            </h1>
            <p className="text-sm md:text-base text-muted-foreground mt-1">
              Manage your spin wheel competitions
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
            
            <div className="flex gap-2">
              <Button
                onClick={() => setWheelSettingsOpen(true)}
                variant="outline"
                className="gap-2"
                data-testid="button-wheel-settings"
              >
                <Settings className="w-4 h-4" />
                Wheel Settings
              </Button>
              <Button
                onClick={() => setWheel2SettingsOpen(true)}
                variant="outline"
                className="gap-2"
                data-testid="button-wheel-2-settings"
              >
                <Settings className="w-4 h-4" />
                Wheel 2 Settings
              </Button>
              
              {/* <Button 
                onClick={() => setCreateDialogOpen(true)} 
                size="icon"
                className="bg-yellow-500 hover:bg-yellow-600 text-black"
                data-testid="button-create-spin"
              >
                <Plus className="w-4 h-4" />
              </Button> */}
            </div>
          </div>
        </div>

        {/* Active Competitions Section */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Active Spin Wheel Competitions</h2>
          <div className="grid gap-4">
            {activeCompetitions.length === 0 ? (
              <div className="text-center py-12 border border-dashed rounded-lg">
                <p className="text-muted-foreground mb-4">
                  No active spin wheel competitions yet
                </p>
                {/* <Button onClick={() => setCreateDialogOpen(true)}>
                  Create Your First Spin Wheel
                </Button> */}
              </div>
            ) : (
              activeCompetitions.map((competition) => (
                <div
                  key={competition.id}
                  className="bg-card border border-border rounded-lg p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex gap-4 flex-1">
                      {competition.imageUrl && (
                        <img
                          src={competition.imageUrl}
                          alt={competition.title}
                          className="w-24 h-24 object-cover rounded-lg"
                        />
                      )}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-xl font-bold text-foreground">
                            {competition.title}
                          </h3>
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-500/20 text-purple-500">
                            SPIN WHEEL
                          </span>
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-500">
                            ACTIVE
                          </span>
                          {competition.wheelType === "wheel2" && (
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-500">
                              RETRO RINGTONE SPIN 
                            </span>
                          )}
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
                          <span className="text-muted-foreground">Display Order: </span>
                          <Input
                            type="number"
                            min="0"
                            defaultValue={competition.displayOrder ?? 999}
                            onBlur={(e) => {
                              const parsedValue = parseInt(e.target.value);
                              const newOrder = isNaN(parsedValue) ? 999 : parsedValue;
                              const currentOrder = competition.displayOrder ?? 999;
                              if (newOrder !== currentOrder) {
                                updateDisplayOrderMutation.mutate({
                                  id: competition.id,
                                  displayOrder: newOrder,
                                });
                              }
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                const parsedValue = parseInt((e.target as HTMLInputElement).value);
                                const newOrder = isNaN(parsedValue) ? 999 : parsedValue;
                                const currentOrder = competition.displayOrder ?? 999;
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

                    <div className="flex flex-row gap-2">
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
                Archived Spin Wheel Competitions ({archivedCompetitions.length})
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              {archivedCompetitions.length === 0 ? (
                <div className="text-center py-8">
                  <Archive className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No archived spin wheel competitions</p>
                </div>
              ) : (
                archivedCompetitions.map((competition) => (
                  <div
                    key={competition.id}
                    className="bg-card border border-border rounded-lg p-6 opacity-90"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex gap-4 flex-1">
                        {competition.imageUrl && (
                          <img
                            src={competition.imageUrl}
                            alt={competition.title}
                            className="w-20 h-20 object-cover rounded-lg"
                          />
                        )}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-lg font-bold text-foreground">
                              {competition.title}
                            </h3>
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-500/20 text-purple-500">
                              SPIN WHEEL
                            </span>
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-500/20 text-gray-500">
                              ARCHIVED
                            </span>
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
              <DialogTitle>Create New Spin Wheel Competition</DialogTitle>
            </DialogHeader>
            <CompetitionForm
              fixedType="spin"
              onSubmit={(data) =>
                createMutation.mutate({ ...data, type: "spin" })
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
              <DialogTitle>Edit Spin Wheel Competition</DialogTitle>
            </DialogHeader>
            {editingCompetition && (
              <CompetitionForm
                data={editingCompetition}
                fixedType="spin"
                onSubmit={(data) =>
                  updateMutation.mutate({
                    id: editingCompetition.id,
                    data: { ...data, type: "spin" },
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
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Archive Spin Wheel Competition</DialogTitle>
            </DialogHeader>
            <p className="text-muted-foreground">
              Are you sure you want to archive this spin wheel competition? Archived games will become inactive and won't be shown on the frontend.
            </p>
            <DialogFooter>
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
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Unarchive Spin Wheel Competition</DialogTitle>
            </DialogHeader>
            <p className="text-muted-foreground">
              Are you sure you want to unarchive this spin wheel competition? The game will become active and will be shown on the frontend.
            </p>
            <DialogFooter>
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

        <WheelSettingsDialog
          open={wheelSettingsOpen}
          onOpenChange={setWheelSettingsOpen}
        />
        <WheelSettingsDialog2
          open={wheel2SettingsOpen}
          onOpenChange={setWheel2SettingsOpen}
        />
      </div>
    </AdminLayout>
  );
}

interface WheelSegment {
  id: string;
  label: string;
  color: string;
  iconKey: string;
  rewardType: "cash" | "points" | "lose";
  rewardValue: number | string;
  probability: number;
  maxWins: number | null;
}

interface MysteryPrize {
  rewardType: "cash" | "points" | "lose";
  rewardValue: number;
  probability: number;
  maxWins: number | null;
  segmentId: string;
}

interface WheelConfig {
  id: string;
  segments: WheelSegment[];
  maxSpinsPerUser: number | null;
  mysteryPrize: MysteryPrize | null;
  isActive: boolean;
  isVisible: boolean;
}

function WheelSettingsDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { toast } = useToast();
  const [segments, setSegments] = useState<Array<WheelSegment & { currentWins?: number }>>([]);
  const [maxSpinsPerUser, setMaxSpinsPerUser] = useState<string>("");
  const [isVisible, setIsVisible] = useState<boolean>(true);
  const [mysteryPrize, setMysteryPrize] = useState<MysteryPrize>({
    rewardType: "cash",
    rewardValue: 100,
    probability: 1,
    maxWins: 1,
    segmentId: "26",
  });

  // Auto-refresh every 10 seconds when dialog is open
  const { data: config, isLoading, refetch } = useQuery<{
    segments: Array<WheelSegment & { currentWins?: number }>;
    maxSpinsPerUser: number | null;
    mysteryPrize: MysteryPrize;
    isVisible: boolean;
  }>({
    queryKey: ["/api/admin/game-spin-config"],
    enabled: open,
    refetchInterval: open ? 10000 : false, // Auto-refresh every 10 seconds when open
  });

  // Update local state when config loads or dialog opens
  useEffect(() => {
    if (config && open) {
      setSegments(config.segments || []);
      setMaxSpinsPerUser(config.maxSpinsPerUser?.toString() || "");
      setIsVisible(config.isVisible ?? true);
      setMysteryPrize(config.mysteryPrize || {
        rewardType: "cash",
        rewardValue: 100,
        probability: 1,
        maxWins: 1,
        segmentId: "26",
      });
    }
  }, [config, open]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      // Find the R_Prize segment
      const rPrizeIndex = segments.findIndex(seg => seg.iconKey === "R_Prize");
      
      if (rPrizeIndex === -1) {
        throw new Error("R_Prize segment not found.");
      }
      
      const rPrizeSegmentId = (rPrizeIndex + 1).toString();
      const updatedMysteryPrize = {
        ...mysteryPrize,
        segmentId: rPrizeSegmentId,
      };

      // Remove currentWins from segments before saving
      const segmentsToSave = segments.map(({ currentWins, ...rest }) => rest);

      const res = await apiRequest("/api/admin/game-spin-config", "PUT", {
        segments: segmentsToSave,
        maxSpinsPerUser: maxSpinsPerUser ? parseInt(maxSpinsPerUser) : null,
        mysteryPrize: updatedMysteryPrize,
        isVisible,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/admin/game-spin-config"],
      });
      toast({ title: "Wheel settings saved successfully" });
      
    },
    onError: (error: any) => {
      toast({
        title: "Failed to save wheel settings",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const totalProbability = segments.reduce(
    (sum, seg) => sum + seg.probability,
    0,
  );
  const isProbabilityValid = Math.abs(totalProbability - 100) < 0.01;

  const updateSegment = (index: number, updates: Partial<WheelSegment>) => {
    const newSegments = [...segments];
    newSegments[index] = { ...newSegments[index], ...updates };
    setSegments(newSegments);
  };

  // Update mystery prize and sync with R_Prize segment
  const updateMysteryPrize = (updates: Partial<MysteryPrize>) => {
    const updated = { ...mysteryPrize, ...updates };
    setMysteryPrize(updated);

    setSegments(prev => prev.map((seg) => {
      if (seg.iconKey === "R_Prize") {
        return {
          ...seg,
          rewardType: updated.rewardType,
          rewardValue: updated.rewardValue,
          probability: updated.probability,
          maxWins: updated.maxWins,
        };
      }
      return seg;
    }));
  };

  const moveSegmentUp = (index: number) => {
    if (index === 0) return;
    
    const newSegments = [...segments];
    [newSegments[index - 1], newSegments[index]] = [newSegments[index], newSegments[index - 1]];
    
    newSegments.forEach((seg, idx) => {
      seg.id = (idx + 1).toString();
    });
    
    setSegments(newSegments);
  };

  const moveSegmentDown = (index: number) => {
    if (index === segments.length - 1) return;
    
    const newSegments = [...segments];
    [newSegments[index], newSegments[index + 1]] = [newSegments[index + 1], newSegments[index]];
    
    newSegments.forEach((seg, idx) => {
      seg.id = (idx + 1).toString();
    });
    
    setSegments(newSegments);
  };

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-8xl max-h-[90vh] bg-gray-700">
        <DialogHeader>
          <DialogTitle>Configure Spin Wheel 1</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Win counts update automatically every 10 seconds
          </p>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Wheel Visibility Toggle */}
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">Show Wheel on Frontend</Label>
              <p className="text-xs text-muted-foreground">
                Hide the wheel on the frontend while you adjust prizes
              </p>
            </div>
            <Switch
              checked={isVisible}
              onCheckedChange={setIsVisible}
              data-testid="switch-wheel-visible"
            />
          </div>

          {/* Max Spins Per User */}
          {/* <div>
            <Label>Max Spins Per User (optional)</Label>
            <Input
              type="number"
              value={maxSpinsPerUser}
              onChange={(e) => setMaxSpinsPerUser(e.target.value)}
              placeholder="Leave empty for unlimited"
              data-testid="input-max-spins"
            />
          </div> */}

          {/* Mystery Prize Configuration */}
          {/* <div className="space-y-3 rounded-lg border p-4 bg-card">
            <div>
              <Label className="text-sm font-semibold">Mystery Prize (R Prize - Segment 26)</Label>
              <p className="text-xs text-muted-foreground mt-1">
                Configure the special mystery prize reward (Ringtone logo icon on black segment)
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Reward Type</Label>
                <select
                  value={mysteryPrize.rewardType}
                  onChange={(e) =>
                    updateMysteryPrize({ rewardType: e.target.value as any })
                  }
                  className="w-full h-10 px-3 rounded-md border border-input bg-background"
                  data-testid="select-mystery-reward-type"
                >
                  <option value="cash">Cash (£)</option>
                  <option value="points">Points</option>
                  <option value="lose">No Win</option>
                </select>
              </div>
              <div>
                <Label className="text-xs">Reward Value</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={mysteryPrize.rewardValue}
                  onChange={(e) =>
                    updateMysteryPrize({ rewardValue: parseFloat(e.target.value) || 0 })
                  }
                  disabled={mysteryPrize.rewardType === "lose"}
                  data-testid="input-mystery-reward-value"
                />
              </div>
              <div>
                <Label className="text-xs">Probability (%) - 0 = disabled</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={mysteryPrize.probability}
                  onChange={(e) =>
                    updateMysteryPrize({ probability: parseFloat(e.target.value) || 0 })
                  }
                  placeholder="e.g. 0.5, 1, 2.5"
                  data-testid="input-mystery-probability"
                />
              </div>
              <div>
                <Label className="text-xs">Max Wins (0 = disabled)</Label>
                <Input
                  type="number"
                  min="0"
                  value={mysteryPrize.maxWins ?? ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    updateMysteryPrize({
                      maxWins: val === "" ? null : parseInt(val, 10),
                    });
                  }}
                  placeholder="Unlimited"
                  data-testid="input-mystery-max-wins"
                />
              </div>
            </div>
          </div> */}

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-lg font-semibold">Wheel Segments</Label>
              <div
                className={`px-3 py-1 rounded-md ${isProbabilityValid ? "bg-green-500/10 text-green-600" : "bg-red-500/10 text-red-600"}`}
              >
                Total: {totalProbability.toFixed(2)}%{" "}
                {isProbabilityValid ? "✓" : "(must be 100%)"}
              </div>
            </div>

            <div className="grid  grid-cols-1 md:grid-cols-2 gap-3 max-h-[50vh]   overflow-y-auto pr-2">
              {segments.map((segment, index) => {
                const isMaxWinsReached = segment.maxWins && segment.maxWins > 0 && 
                                         (segment.currentWins || 0) >= segment.maxWins;
                return (
                  <div
                    key={segment.id}
                    className="border border-border  rounded-lg p-4 space-y-3 bg-card"
                  >
                    {/* Simplified header */}
                    <div className="flex items-center  justify-between mb-2 pb-2 border-b">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">Position {index + 1}</span>
                        {segment.iconKey === "R_Prize" && (
                          <span className="text-xs bg-yellow-500/10 text-yellow-600 px-2 py-0.5 rounded">
                            Mystery Prize
                          </span>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => moveSegmentUp(index)}
                          disabled={index === 0}
                          className="h-7 w-7 p-0"
                          data-testid={`button-move-up-${index}`}
                        >
                          ↑
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => moveSegmentDown(index)}
                          disabled={index === segments.length - 1}
                          className="h-7 w-7 p-0"
                          data-testid={`button-move-down-${index}`}
                        >
                          ↓
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">Label</Label>
                        <Input
                          value={segment.label}
                          onChange={(e) =>
                            updateSegment(index, { label: e.target.value })
                          }
                          data-testid={`input-label-${index}`}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Color (hex)</Label>
                        <Input
                          value={segment.color}
                          onChange={(e) =>
                            updateSegment(index, { color: e.target.value })
                          }
                          data-testid={`input-color-${index}`}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-5 gap-3">
                     <div>
                  <Label className="text-xs">Reward Type</Label>

                  <select
                    value={segment.rewardType}
                    onChange={(e) =>
                      updateSegment(index, { rewardType: e.target.value as any })
                    }
                    className={`
                      w-full h-10 px-3 rounded-md border 
                      appearance-none
                      ${
                        segment.rewardType === "cash"
                          ? "bg-green-600 text-white border-green-700"
                          :
                          segment.rewardType === "points"?
                          "bg-yellow-500 text-white border-blue-700"
                          :
                          segment.rewardType === "lose"
                          ? "bg-red-600 text-white border-red-700"
                          : "bg-background text-foreground border-input"
                      }
                    `}
                    data-testid={`select-reward-type-${index}`}
                  >
                    <option value="cash" className="bg-white text-black">Cash (£)</option>
                    <option value="points" className="bg-white text-black">Points</option>
                    <option value="lose" className="bg-white text-black">No Win</option>
                  </select>
                </div>


                      <div>
                        <Label className="text-xs">Reward Value</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={segment.rewardValue}
                          onChange={(e) =>
                            updateSegment(index, {
                              rewardValue: parseFloat(e.target.value) || 0,
                            })
                          }
                          disabled={segment.rewardType === "lose"}
                          data-testid={`input-reward-value-${index}`}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Probability (%)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          value={segment.probability}
                          onChange={(e) =>
                            updateSegment(index, {
                              probability: parseFloat(e.target.value) || 0,
                            })
                          }
                          placeholder="e.g. 0.5, 1, 2.5"
                          data-testid={`input-probability-${index}`}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Max Wins</Label>
                        <Input
                          type="number"
                          min="0"
                          value={segment.maxWins ?? ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            updateSegment(index, {
                              maxWins: val === "" ? null : parseInt(val, 10),
                            });
                          }}
                          placeholder="Unlimited"
                          data-testid={`input-max-wins-${index}`}
                          className={isMaxWinsReached ? "border-red-500" : ""}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Current Wins</Label>
                        <div className="h-10 px-3 rounded-md border border-input bg-muted flex items-center justify-center">
                          <span className={`font-medium ${isMaxWinsReached ? "text-red-600" : "text-foreground"}`}>
                            {segment.currentWins || 0}
                          </span>
                          {isMaxWinsReached && (
                            <span className="ml-2 text-xs text-red-600 font-medium">(Max Reached)</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
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
            disabled={!isProbabilityValid || saveMutation.isPending}
            data-testid="button-save-wheel-settings"
          >
            {saveMutation.isPending ? "Saving..." : "Save Settings"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function WheelSettingsDialog2({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { toast } = useToast();
  const [segments, setSegments] = useState<Array<WheelSegment & { currentWins?: number }>>([]);
  const [maxSpinsPerUser, setMaxSpinsPerUser] = useState<string>("");
  const [isVisible, setIsVisible] = useState<boolean>(true);

  // Auto-refresh every 10 seconds when dialog is open
  const { data: config, isLoading } = useQuery<{
    segments: Array<WheelSegment & { currentWins?: number }>;
    maxSpinsPerUser: number | null;
    isVisible: boolean;
  }>({
    queryKey: ["/api/admin/game-spin-2-config"],
    enabled: open,
    refetchInterval: open ? 10000 : false,
  });

  // Update local state when config loads or dialog opens
  useEffect(() => {
    if (config && open) {
      setSegments(config.segments || []);
      setMaxSpinsPerUser(config.maxSpinsPerUser?.toString() || "");
      setIsVisible(config.isVisible ?? true);
    }
  }, [config, open]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      // Remove currentWins from segments before saving
      const segmentsToSave = segments.map(({ currentWins, ...rest }) => rest);

      const res = await apiRequest("/api/admin/game-spin-2-config", "PUT", {
        segments: segmentsToSave,
        maxSpinsPerUser: maxSpinsPerUser ? parseInt(maxSpinsPerUser) : null,
        isVisible,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/admin/game-spin-2-config"],
      });
      toast({ title: "Arcade Spin settings saved successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to save settings",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resetWinsMutation = useMutation({
  mutationFn: async () => {
    const res = await apiRequest(
      "/api/admin/game-spin-2-reset-wins",
      "POST"
    );
    return res.json();
  },
  onSuccess: () => {
    queryClient.invalidateQueries({
      queryKey: ["/api/admin/game-spin-2-config"],
    });
    toast({ title: "Wheel 2 wins reset successfully" });
  },
  onError: () => {
    toast({
      title: "Failed to reset wins",
      variant: "destructive",
    });
  },
});


  const totalProbability = segments.reduce(
    (sum, seg) => sum + seg.probability,
    0,
  );
  const isProbabilityValid = Math.abs(totalProbability - 100) < 0.01;

  const updateSegment = (index: number, updates: Partial<WheelSegment>) => {
    const newSegments = [...segments];
    newSegments[index] = { ...newSegments[index], ...updates };
    setSegments(newSegments);
  };

 const moveSegmentUp = (index: number) => {
  if (index === 0) return;

  const newSegments = [...segments];
  [newSegments[index - 1], newSegments[index]] =
    [newSegments[index], newSegments[index - 1]];

  setSegments(newSegments);
};


 const moveSegmentDown = (index: number) => {
  if (index === segments.length - 1) return;

  const newSegments = [...segments];
  [newSegments[index], newSegments[index + 1]] =
    [newSegments[index + 1], newSegments[index]];

  setSegments(newSegments);
};


const deleteSegment = (index: number) => {
  if (segments.length <= 12) {
    toast({
      title: "Cannot delete segment",
      description: "Arcade Spin requires exactly 12 segments",
      variant: "destructive",
    });
    return;
  }

  const newSegments = segments.filter((_, i) => i !== index);
  setSegments(newSegments);
};


  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl max-h-[90vh] bg-gray-700 overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Configure Arcade Spin (Wheel 2)</DialogTitle>
          <p className="text-sm text-muted-foreground">
            12-segment wheel configuration
          </p>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Wheel Visibility Toggle */}
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">Show Wheel on Frontend</Label>
              <p className="text-xs text-muted-foreground">
                Hide the wheel on the frontend while you adjust prizes
              </p>
            </div>
            <Switch
              checked={isVisible}
              onCheckedChange={setIsVisible}
              data-testid="switch-wheel-visible"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-lg font-semibold">Arcade Spin Segments</Label>
              <div
                className={`px-3 py-1 rounded-md ${isProbabilityValid ? "bg-green-500/10 text-green-600" : "bg-red-500/10 text-red-600"}`}
              >
                Total: {totalProbability.toFixed(2)}%{" "}
                {isProbabilityValid ? "✓" : "(must be 100%)"}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[50vh] overflow-y-auto pr-2">
              {segments.map((segment, index) => {
                const isMaxWinsReached = segment.maxWins && segment.maxWins > 0 && 
                                         (segment.currentWins || 0) >= segment.maxWins;
                return (
                  <div
                    key={segment.id}
                    className="border border-border rounded-lg p-4 space-y-3 bg-card"
                  >
                    {/* Simplified header */}
                    <div className="flex items-center justify-between mb-2 pb-2 border-b">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">Position {index + 1}</span>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => moveSegmentUp(index)}
                          disabled={index === 0}
                          className="h-7 w-7 p-0"
                        >
                          ↑
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => moveSegmentDown(index)}
                          disabled={index === segments.length - 1}
                          className="h-7 w-7 p-0"
                        >
                          ↓
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">Label</Label>
                        <Input
                          value={segment.label}
                          onChange={(e) =>
                            updateSegment(index, { label: e.target.value })
                          }
                          data-testid={`input-label-${index}`}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Color (hex)</Label>
                        <Input
                          value={segment.color}
                          onChange={(e) =>
                            updateSegment(index, { color: e.target.value })
                          }
                          data-testid={`input-color-${index}`}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-5 gap-3">
                      <div>
                        <Label className="text-xs">Reward Type</Label>
                        <select
                          value={segment.rewardType}
                          onChange={(e) =>
                            updateSegment(index, { rewardType: e.target.value as any })
                          }
                          className={`
                            w-full h-10 px-3 rounded-md border 
                            appearance-none
                            ${
                              segment.rewardType === "cash"
                                ? "bg-green-600 text-white border-green-700"
                                : segment.rewardType === "points"
                                ? "bg-yellow-500 text-white border-blue-700"
                                : segment.rewardType === "lose"
                                ? "bg-red-600 text-white border-red-700"
                                : "bg-background text-foreground border-input"
                            }
                          `}
                          data-testid={`select-reward-type-${index}`}
                        >
                          <option value="cash" className="bg-white text-black">Cash (£)</option>
                          <option value="points" className="bg-white text-black">Points</option>
                          <option value="lose" className="bg-white text-black">No Win</option>
                        </select>
                      </div>
                      <div>
                        <Label className="text-xs">Reward Value</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={segment.rewardValue}
                          onChange={(e) =>
                            updateSegment(index, {
                              rewardValue: parseFloat(e.target.value) || 0,
                            })
                          }
                          disabled={segment.rewardType === "lose"}
                          data-testid={`input-reward-value-${index}`}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Probability (%)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          value={segment.probability}
                          onChange={(e) =>
                            updateSegment(index, {
                              probability: parseFloat(e.target.value) || 0,
                            })
                          }
                          placeholder="e.g. 0.5, 1, 2.5"
                          data-testid={`input-probability-${index}`}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Max Wins</Label>
                        <Input
                          type="number"
                          min="0"
                          value={segment.maxWins ?? ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            updateSegment(index, {
                              maxWins: val === "" ? null : parseInt(val, 10),
                            });
                          }}
                          placeholder="Unlimited"
                          data-testid={`input-max-wins-${index}`}
                          className={isMaxWinsReached ? "border-red-500" : ""}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Current Wins</Label>
                        <div className="h-10 px-3 rounded-md border border-input bg-muted flex items-center justify-center">
                          <span className={`font-medium ${isMaxWinsReached ? "text-red-600" : "text-foreground"}`}>
                            {segment.currentWins || 0}
                          </span>
                          {isMaxWinsReached && (
                            <span className="ml-2 text-xs text-red-600 font-medium">(Max Reached)</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
<DialogFooter className="flex justify-between">
  <Button
    variant="destructive"
    onClick={() => {
      if (
        confirm(
          "Are you sure? This will permanently reset ALL current wins for Wheel 2."
        )
      ) {
        resetWinsMutation.mutate();
      }
    }}
    disabled={resetWinsMutation.isPending}
  >
    {resetWinsMutation.isPending ? "Resetting..." : "Reset Wins"}
  </Button>

  <div className="flex gap-2">
    <Button
      variant="outline"
      onClick={() => onOpenChange(false)}
      disabled={saveMutation.isPending}
    >
      Cancel
    </Button>
    <Button
      onClick={() => saveMutation.mutate()}
      disabled={!isProbabilityValid || saveMutation.isPending}
    >
      {saveMutation.isPending ? "Saving..." : "Save Settings"}
    </Button>
  </div>
</DialogFooter>

        {/* <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saveMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={() => saveMutation.mutate()}
            disabled={!isProbabilityValid || saveMutation.isPending}
            data-testid="button-save-wheel-settings"
          >
            {saveMutation.isPending ? "Saving..." : "Save Settings"}
          </Button>
        </DialogFooter> */}
      </DialogContent>
    </Dialog>
  );
}