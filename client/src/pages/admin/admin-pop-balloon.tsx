// app/admin-pop-balloon.tsx
import AdminLayout from "@/components/admin/admin-layout";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2, Trophy, Upload, Settings, Archive, ArchiveRestore, Eye, EyeOff, Gift } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { Link } from "wouter";

interface CompetitionFormData {
  title: string;
  description: string;
  imageUrl: string;
  type: "pop";
  ticketPrice: string;
  maxTickets: string;
  ringtonePoints: string;
  endDate?: string;
}

function CompetitionForm({
  data,
  onSubmit,
  onCancel,
  isLoading,
}: {
  data?: Competition;
  onSubmit: (formData: CompetitionFormData) => void;
  onCancel: () => void;
  isLoading: boolean;
}) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState<CompetitionFormData>({
    title: data?.title || "",
    description: data?.description || "",
    imageUrl: data?.imageUrl || "",
    type: "pop",
    ticketPrice: data?.ticketPrice || "2.00",
    maxTickets: data?.maxTickets?.toString() || "",
    ringtonePoints: data?.ringtonePoints?.toString() || "0",
    endDate: data?.endDate
      ? new Date(data.endDate).toISOString().slice(0, 16)
      : "",
  });
  const [uploading, setUploading] = useState(false);

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
    <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1 sm:pr-2">
      <div>
        <Label>Title</Label>
        <Input
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          placeholder="Pop Balloon Game Title"
          data-testid="input-title"
        />
      </div>

      <div>
        <Label>Description</Label>
        <Textarea
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="Description for pop balloon game..."
          rows={4}
          data-testid="textarea-description"
        />
      </div>

      <div>
        <Label>Game Image</Label>
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

      <div>
        <Label>Game Type</Label>
        <div className="w-full p-2 border border-border rounded-md bg-muted text-foreground">
          Pop Balloon Game
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Uses global pop game prize configuration
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div>
          <Label>Price per Game (£)</Label>
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
          <Label>Max Games (Optional)</Label>
          <Input
            type="number"
            value={form.maxTickets}
            onChange={(e) => setForm({ ...form, maxTickets: e.target.value })}
            placeholder="Leave empty for unlimited"
            data-testid="input-maxTickets"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Leave empty if games should be unlimited
          </p>
        </div>

        <div>
          <Label>Ringtone Points Reward</Label>
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
        <Label>End Date & Time (Optional)</Label>
        <Input
          type="datetime-local"
          value={form.endDate || ""}
          onChange={(e) => setForm({ ...form, endDate: e.target.value })}
          placeholder="Select end date and time"
          data-testid="input-endDate"
        />
        <p className="text-xs text-muted-foreground mt-1">
          Leave empty for no end date
        </p>
      </div>

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
          {isLoading ? "Saving..." : "Save Pop Game"}
        </Button>
      </DialogFooter>
    </div>
  );
}

export default function AdminPopBalloon() {
  const { toast } = useToast();
  const [editingCompetition, setEditingCompetition] =
    useState<Competition | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [archiveConfirm, setArchiveConfirm] = useState<string | null>(null);
  const [unarchiveConfirm, setUnarchiveConfirm] = useState<string | null>(null);
  const [showArchivedModal, setShowArchivedModal] = useState(false);

  const { data: allCompetitions, isLoading } = useQuery<Competition[]>({
    queryKey: ["/api/admin/competitions"],
  });

  // Filter competitions by type and status
  const competitions = allCompetitions?.filter((c) => c.type === "pop") || [];
  const activeCompetitions = competitions.filter((c) => c.isActive);
  const archivedCompetitions = competitions.filter((c) => !c.isActive);

  const createMutation = useMutation({
    mutationFn: async (formData: CompetitionFormData) => {
      const payload: any = {
        ...formData,
        type: "pop",
        ticketPrice: parseFloat(formData.ticketPrice).toFixed(2),
        maxTickets: formData.maxTickets ? parseInt(formData.maxTickets) : null,
        ringtonePoints: parseInt(formData.ringtonePoints),
      };

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
      toast({ title: "Pop Balloon game created successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create pop balloon game",
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
        type: "pop",
        ticketPrice: parseFloat(data.ticketPrice).toFixed(2),
        maxTickets: data.maxTickets ? parseInt(data.maxTickets) : null,
        ringtonePoints: parseInt(data.ringtonePoints),
      };

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
      toast({ title: "Pop Balloon game updated successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update pop balloon game",
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
      toast({ title: "Pop Balloon game archived successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to archive pop balloon game",
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
      toast({ title: "Pop Balloon game unarchived successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to unarchive pop balloon game",
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
              data-testid="heading-pop-balloon"
            >
              Pop Balloon Games
            </h1>
            <p className="text-sm md:text-base text-muted-foreground mt-1">
              Manage your pop balloon games
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
            
            <div className="flex  gap-2">
              <Link to="/admin/ringtone-pop/settings">
                <Button
                  variant="outline"
                  className="gap-2"
                  data-testid="button-pop-settings"
                >
                  <Settings className="w-4 h-4" />
                  Pop Settings
                </Button>
              </Link>
              {/* <Button
                onClick={() => setCreateDialogOpen(true)}
                data-testid="button-create-pop"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Pop Game
              </Button> */}
            </div>
          </div>
        </div>

        {/* Active Competitions Section */}
        <div className="space-y-4">
          {/* <h2 className="text-lg font-semibold text-foreground">Active Pop Balloon Games</h2> */}
          <div className="grid gap-4">
            {activeCompetitions.length === 0 ? (
              <div className="text-center py-12 border border-dashed rounded-lg">
                <p className="text-muted-foreground mb-4">
                  No active pop balloon games yet
                </p>
                {/* <Button onClick={() => setCreateDialogOpen(true)}>
                  Create Your First Pop Game
                </Button> */}
              </div>
            ) : (
              activeCompetitions.map((competition) => (
                <div
                  key={competition.id}
                  className="bg-card border border-border rounded-lg p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-start flex-col sm:flex-row justify-between">
                    <div className="flex gap-4 flex-col sm:flex-row  flex-1">
                      {competition.imageUrl && (
                        <img
                          src={competition.imageUrl}
                          alt={competition.title}
                          className="w-full h-98 sm:w-24 sm:h-24 object-cover rounded-lg"
                        />
                      )}
                      <div className="flex-1">
                        <div className="flex items-center flex-col sm:flex-row gap-2 mb-2">
                          <h3 className="text-xl font-bold text-foreground">
                            {competition.title}
                          </h3>
                          <div>

                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-pink-500/20 text-pink-500">
                            POP BALLOON
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
                              {competition.soldTickets || 0}{" "}
                              {competition.maxTickets
                                ? `/ ${competition.maxTickets}`
                                : ""}
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
                              const currentOrder =
                                competition.displayOrder ?? 999;
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

                    <div className="flex flex-row gap-2">
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
                      <Link to={`/admin/prize-table/${competition.id}`}>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1 text-purple-500 hover:text-purple-600 hover:bg-purple-50"
                        data-testid={`button-prizes-${competition.id}`}
                      >
                        <Gift  className="w-4 h-4" />
                        <span className="hidden sm:inline">Prizes</span>
                      </Button>
                    </Link>
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
                Archived Pop Balloon Games ({archivedCompetitions.length})
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              {archivedCompetitions.length === 0 ? (
                <div className="text-center py-8">
                  <Archive className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No archived pop balloon games</p>
                </div>
              ) : (
                archivedCompetitions.map((competition) => (
                  <div
                    key={competition.id}
                    className="bg-card border border-border rounded-lg p-6 opacity-90"
                  >
                    <div className="flex items-start flex-col sm:flex-row justify-between">
                      <div className="flex gap-4 flex-col sm:flex-row flex-1">
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

                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-pink-500/20 text-pink-500">
                              POP BALLOON
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
                                {competition.soldTickets || 0}{" "}
                                {competition.maxTickets
                                  ? `/ ${competition.maxTickets}`
                                  : ""}
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
              <DialogTitle>Create New Pop Balloon Game</DialogTitle>
            </DialogHeader>
            <CompetitionForm
              onSubmit={(data) => createMutation.mutate(data)}
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
              <DialogTitle>Edit Pop Balloon Game</DialogTitle>
            </DialogHeader>
            {editingCompetition && (
              <CompetitionForm
                data={editingCompetition}
                onSubmit={(data) =>
                  updateMutation.mutate({
                    id: editingCompetition.id,
                    data,
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
              <DialogTitle>Archive Pop Balloon Game</DialogTitle>
            </DialogHeader>
            <p className="text-muted-foreground">
              Are you sure you want to archive this pop balloon game? Archived games will become inactive and won't be shown on the frontend.
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
          <DialogContent className="w-[90vw] max-w-sm sm:max-w-md mx-auto">
            <DialogHeader>
              <DialogTitle>Unarchive Pop Balloon Game</DialogTitle>
            </DialogHeader>
            <p className="text-muted-foreground">
              Are you sure you want to unarchive this pop balloon game? The game will become active and will be shown on the frontend.
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
      </div>
    </AdminLayout>
  );
}