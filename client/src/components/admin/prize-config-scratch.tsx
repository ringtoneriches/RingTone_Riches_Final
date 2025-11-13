import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

export interface ScratchCardImageConfig {
  id?: string;
  imageName: string;
  imageKey: string;
  rewardType: "cash" | "points" | "physical" | "try_again";
  rewardValue: string;
  weight: number;
  maxWins: number | null;
  quantityWon: number;
  isActive: boolean;
  displayOrder: number;
}

export interface ScratchPrizeData {
  images?: ScratchCardImageConfig[];
}

const DEFAULT_LANDMARK_IMAGES = [
  { name: "Barrier Reef", key: "barrier_reef" },
  { name: "Angel of the North", key: "angel_of_north" },
  { name: "Big Ben", key: "big_ben" },
  { name: "Buckingham Palace", key: "buckingham_palace" },
  { name: "Burj Khalifa", key: "burj_khalifa" },
  { name: "Colosseum", key: "colosseum" },
  { name: "Eiffel Tower", key: "eiffel_tower" },
  { name: "Empire State", key: "empire_state" },
  { name: "Golden Gate Bridge", key: "golden_gate" },
  { name: "Grand Canyon", key: "grand_canyon" },
  { name: "Great Wall of China", key: "great_wall" },
  { name: "Mount Everest", key: "mount_everest" },
  { name: "Notre Dame", key: "notre_dame" },
  { name: "Pyramids of Pisa", key: "pyramids_pisa" },
  { name: "Statue of Liberty", key: "statue_liberty" },
  { name: "Stonehenge", key: "stonehenge" },
  { name: "Taj Mahal", key: "taj_mahal" },
  { name: "Times Square", key: "times_square" },
  { name: "Tower Bridge", key: "tower_bridge" },
  { name: "Tower of Pisa", key: "tower_pisa" },
];

interface PrizeConfigScratchProps {
  initialData?: any;
  onSave: (data: any) => void;
  isLoading?: boolean;
}

export default function PrizeConfigScratch({
  initialData,
  onSave,
  isLoading,
}: PrizeConfigScratchProps) {
  const { toast } = useToast();
  const [editingImage, setEditingImage] = useState<ScratchCardImageConfig | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: images = [], isLoading: imagesLoading } = useQuery<ScratchCardImageConfig[]>({
    queryKey: ["/api/admin/scratch-images"],
    refetchInterval: 5000,
  });

  const createMutation = useMutation({
    mutationFn: async (imageData: ScratchCardImageConfig) => {
      return await apiRequest("/api/admin/scratch-images", "POST", imageData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/scratch-images"] });
      toast({
        title: "Success",
        description: "Scratch card image created successfully",
      });
      setIsDialogOpen(false);
      setEditingImage(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create scratch card image",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ScratchCardImageConfig> }) => {
      return await apiRequest(`/api/admin/scratch-images/${id}`, "PUT", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/scratch-images"] });
      toast({
        title: "Success",
        description: "Scratch card image updated successfully",
      });
      setIsDialogOpen(false);
      setEditingImage(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update scratch card image",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest(`/api/admin/scratch-images/${id}`, "DELETE", {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/scratch-images"] });
      toast({
        title: "Success",
        description: "Scratch card image deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete scratch card image",
        variant: "destructive",
      });
    },
  });

  const openCreateDialog = () => {
    setEditingImage({
      imageName: "",
      imageKey: "",
      rewardType: "try_again",
      rewardValue: "0",
      weight: 100,
      maxWins: null,
      quantityWon: 0,
      isActive: true,
      displayOrder: images.length,
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (image: ScratchCardImageConfig) => {
    setEditingImage({ ...image });
    setIsDialogOpen(true);
  };

  const handleSaveImage = () => {
    if (!editingImage) return;

    if (!editingImage.imageName || !editingImage.imageKey) {
      toast({
        title: "Validation Error",
        description: "Image name and key are required",
        variant: "destructive",
      });
      return;
    }

    if (editingImage.weight < 0) {
      toast({
        title: "Validation Error",
        description: "Weight cannot be negative",
        variant: "destructive",
      });
      return;
    }

    if (editingImage.id) {
      updateMutation.mutate({
        id: editingImage.id,
        data: {
          imageName: editingImage.imageName,
          imageKey: editingImage.imageKey,
          rewardType: editingImage.rewardType,
          rewardValue: editingImage.rewardValue,
          weight: editingImage.weight,
          maxWins: editingImage.maxWins,
          isActive: editingImage.isActive,
          displayOrder: editingImage.displayOrder,
        },
      });
    } else {
      createMutation.mutate(editingImage);
    }
  };

  const totalWeight = images.reduce(
    (sum, img) => sum + (img.isActive ? Number(img.weight) : 0),
    0
  );

  const calculateWinRate = (weight: number, isActive: boolean) => {
    if (!isActive || totalWeight === 0) return 0;
    return ((weight / totalWeight) * 100).toFixed(2);
  };

  const initializeDefaultImages = async () => {
    const defaultConfigs = DEFAULT_LANDMARK_IMAGES.map((img, index) => ({
      imageName: img.name,
      imageKey: img.key,
      rewardType: "try_again" as const,
      rewardValue: "0",
      weight: 50,
      maxWins: null,
      quantityWon: 0,
      isActive: true,
      displayOrder: index,
    }));

    for (const config of defaultConfigs) {
      await createMutation.mutateAsync(config);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-foreground">
            Scratch Card Image Configuration
          </h3>
          <div className="flex gap-2">
            {images.length === 0 && !imagesLoading && (
              <Button
                onClick={initializeDefaultImages}
                variant="outline"
                size="sm"
                data-testid="button-init-default-images"
              >
                Load Default Images
              </Button>
            )}
            <Button 
              onClick={openCreateDialog} 
              size="sm"
              data-testid="button-add-image"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Image
            </Button>
          </div>
        </div>

        <div className="bg-primary/10 p-3 rounded-lg mb-4">
          <p className="text-sm text-foreground">
            <strong>How it works:</strong> When a player scratches and reveals 3 matching images, they win that image's configured prize.
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Each image has a weight that determines how often it appears on the scratch card. Higher weight = appears more often.
          </p>
        </div>

        {imagesLoading ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Loading images...</p>
          </div>
        ) : images.length === 0 ? (
          <div className="text-center py-8 border border-dashed border-border rounded-lg">
            <p className="text-muted-foreground">No scratch card images configured</p>
            <p className="text-xs text-muted-foreground mt-2">
              Click "Load Default Images" to get started with 20 landmark images
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {images.map((image, index) => {
              const winRate = calculateWinRate(Number(image.weight), image.isActive);
              return (
                <div
                  key={image.id}
                  className="bg-muted p-4 rounded-lg border border-border"
                  data-testid={`card-scratch-image-${image.id}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-medium text-foreground" data-testid={`text-image-name-${image.id}`}>
                          {image.imageName}
                        </h4>
                        <span className="text-xs px-2 py-1 rounded-full bg-primary/20 text-primary">
                          Win Rate: {winRate}%
                        </span>
                        {!image.isActive && (
                          <span className="text-xs px-2 py-1 rounded-full bg-red-500/20 text-red-500">
                            Inactive
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                        <div>
                          <span className="text-muted-foreground">Reward: </span>
                          <span className="font-medium" data-testid={`text-reward-${image.id}`}>
                            {image.rewardType === "cash" && `£${image.rewardValue}`}
                            {image.rewardType === "points" && `${image.rewardValue} Points`}
                            {image.rewardType === "physical" && image.rewardValue}
                            {image.rewardType === "try_again" && "Try Again"}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Weight: </span>
                          <span className="font-medium" data-testid={`text-weight-${image.id}`}>{image.weight}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Max Wins: </span>
                          <span className="font-medium" data-testid={`text-max-wins-${image.id}`}>
                            {image.maxWins ?? "Unlimited"}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Won: </span>
                          <span className="font-medium" data-testid={`text-quantity-won-${image.id}`}>{image.quantityWon}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(image)}
                        data-testid={`button-edit-image-${image.id}`}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteMutation.mutate(image.id!)}
                        className="text-red-500 hover:text-red-600"
                        data-testid={`button-delete-image-${image.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="bg-primary/10 p-3 rounded-lg mt-4">
          <p className="text-sm text-foreground">
            <strong>Total Weight:</strong> {totalWeight}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Win rates are calculated as (image weight / total active weight) × 100%
          </p>
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>
              {editingImage?.id ? "Edit" : "Add"} Scratch Card Image
            </DialogTitle>
          </DialogHeader>

          <ScrollArea className="max-h-[calc(90vh-120px)] pr-4">
            {editingImage && (
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Image Name</Label>
                    <Input
                      value={editingImage.imageName}
                      onChange={(e) =>
                        setEditingImage({ ...editingImage, imageName: e.target.value })
                      }
                      placeholder="e.g., Big Ben"
                      data-testid="input-image-name"
                    />
                  </div>

                  <div>
                    <Label>Image Key</Label>
                    <Input
                      value={editingImage.imageKey}
                      onChange={(e) =>
                        setEditingImage({ ...editingImage, imageKey: e.target.value })
                      }
                      placeholder="e.g., big_ben"
                      data-testid="input-image-key"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Used to match with image files
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Reward Type</Label>
                    <select
                      className="w-full p-2 border border-border rounded-md bg-background text-foreground"
                      value={editingImage.rewardType}
                      onChange={(e) =>
                        setEditingImage({
                          ...editingImage,
                          rewardType: e.target.value as any,
                        })
                      }
                      data-testid="select-reward-type"
                    >
                      <option value="cash">Cash (£)</option>
                      <option value="points">Ringtone Points</option>
                      <option value="physical">Physical Prize</option>
                      <option value="try_again">Try Again (No Win)</option>
                    </select>
                  </div>

                  <div>
                    <Label>Reward Value</Label>
                    {editingImage.rewardType === "cash" && (
                      <Input
                        type="number"
                        step="0.01"
                        value={editingImage.rewardValue}
                        onChange={(e) =>
                          setEditingImage({ ...editingImage, rewardValue: e.target.value })
                        }
                        placeholder="10.00"
                        data-testid="input-reward-value"
                      />
                    )}
                    {editingImage.rewardType === "points" && (
                      <Input
                        type="number"
                        value={editingImage.rewardValue}
                        onChange={(e) =>
                          setEditingImage({ ...editingImage, rewardValue: e.target.value })
                        }
                        placeholder="100"
                        data-testid="input-reward-value"
                      />
                    )}
                    {editingImage.rewardType === "physical" && (
                      <Input
                        value={editingImage.rewardValue}
                        onChange={(e) =>
                          setEditingImage({ ...editingImage, rewardValue: e.target.value })
                        }
                        placeholder="Prize description"
                        data-testid="input-reward-value"
                      />
                    )}
                    {editingImage.rewardType === "try_again" && (
                      <Input
                        value="No Prize"
                        disabled
                        className="bg-muted"
                        data-testid="input-reward-value"
                      />
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Weight (Probability) - 0 = disabled</Label>
                    <Input
                      type="number"
                      min="0"
                      value={editingImage.weight}
                      onChange={(e) =>
                        setEditingImage({
                          ...editingImage,
                          weight: e.target.value !== "" ? parseInt(e.target.value) : 0,
                        })
                      }
                      placeholder="100"
                      data-testid="input-weight"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Higher = more frequent. Set to 0 to disable.
                    </p>
                  </div>

                  <div>
                    <Label>Max Wins (0 = disabled)</Label>
                    <Input
                      type="number"
                      min="0"
                      value={editingImage.maxWins ?? ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        setEditingImage({
                          ...editingImage,
                          maxWins: val === "" ? null : parseInt(val, 10),
                        });
                      }}
                      placeholder="Leave empty for unlimited"
                      data-testid="input-max-wins"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={editingImage.isActive}
                    onChange={(e) =>
                      setEditingImage({ ...editingImage, isActive: e.target.checked })
                    }
                    className="w-4 h-4"
                    data-testid="checkbox-active"
                  />
                  <Label htmlFor="isActive" className="cursor-pointer">
                    Active (appears in game)
                  </Label>
                </div>

                <div className="bg-muted p-3 rounded-lg">
                  <p className="text-sm">
                    <strong>Current Win Rate:</strong>{" "}
                    {calculateWinRate(editingImage.weight, editingImage.isActive)}%
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Based on current total weight of {totalWeight}
                  </p>
                </div>
              </div>
            )}
          </ScrollArea>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => {
                setIsDialogOpen(false);
                setEditingImage(null);
              }}
              data-testid="button-cancel"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveImage}
              disabled={createMutation.isPending || updateMutation.isPending}
              data-testid="button-save-image"
            >
              <Save className="w-4 h-4 mr-2" />
              {createMutation.isPending || updateMutation.isPending ? "Saving..." : "Save Image"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}