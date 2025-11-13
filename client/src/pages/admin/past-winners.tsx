import AdminLayout from "@/components/admin/admin-layout";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Winner {
  id: string;
  userId: string;
  competitionId: string | null;
  prizeDescription: string;
  prizeValue: string;
  imageUrl: string | null;
  createdAt: string;
}

interface WinnerWithDetails {
  winners: Winner;
  users: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
  competitions: {
    id: string;
    title: string;
  } | null;
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

interface WinnerFormData {
  userId: string;
  competitionId: string;
  prizeDescription: string;
  prizeValue: string;
  imageUrl: string;
}

interface WinnerPayload {
  userId: string;
  competitionId: string | null;
  prizeDescription: string;
  prizeValue: string;
  imageUrl: string | null;
}

function WinnerForm({
  data,
  onSubmit,
  onCancel,
  isLoading,
}: {
  data?: Winner;
  onSubmit: (formData: WinnerPayload) => void;
  onCancel: () => void;
  isLoading: boolean;
}) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState<WinnerFormData>({
    userId: data?.userId || "",
    competitionId: data?.competitionId || "",
    prizeDescription: data?.prizeDescription || "",
    prizeValue: data?.prizeValue || "",
    imageUrl: data?.imageUrl || "",
  });
  const [uploading, setUploading] = useState(false);

  // Fetch users for selection
  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
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

  return (
    <div className="space-y-4">
      <div>
        <Label>User *</Label>
        <Select
          value={form.userId}
          onValueChange={(value) => setForm({ ...form, userId: value })}
        >
          <SelectTrigger data-testid="select-user">
            <SelectValue placeholder="Select a user" />
          </SelectTrigger>
          <SelectContent>
            {users.map((user) => (
              <SelectItem key={user.id} value={user.id}>
                {user.firstName} {user.lastName} ({user.email})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Competition (Optional)</Label>
        <Select
          value={form.competitionId || "none"}
          onValueChange={(value) => setForm({ ...form, competitionId: value === "none" ? "" : value })}
        >
          <SelectTrigger data-testid="select-competition">
            <SelectValue placeholder="Select a competition" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None</SelectItem>
            {competitions.map((comp) => (
              <SelectItem key={comp.id} value={comp.id}>
                {comp.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Prize Description *</Label>
        <Textarea
          value={form.prizeDescription}
          onChange={(e) => setForm({ ...form, prizeDescription: e.target.value })}
          placeholder="e.g., BMW M4 Competition, £5000 Cash Prize"
          rows={3}
          data-testid="input-prize-description"
        />
      </div>

      <div>
        <Label>Prize Value *</Label>
        <Input
          value={form.prizeValue}
          onChange={(e) => setForm({ ...form, prizeValue: e.target.value })}
          placeholder="e.g., £50,000, 10,000 Ringtones"
          data-testid="input-prize-value"
        />
      </div>

      <div>
        <Label>Prize Image</Label>
        <div className="space-y-2">
          <Input
            value={form.imageUrl}
            onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
            placeholder="Image URL or upload a file"
            data-testid="input-image-url"
          />
          <div className="flex gap-2">
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
              data-testid="button-upload-image"
            >
              <Upload className="h-4 w-4 mr-2" />
              {uploading ? "Uploading..." : "Upload Image"}
            </Button>
          </div>
          {form.imageUrl && (
            <div className="mt-2">
              <img
                src={form.imageUrl}
                alt="Prize preview"
                className="max-w-full h-32 object-contain rounded border"
              />
            </div>
          )}
        </div>
      </div>

      <DialogFooter className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
          data-testid="button-cancel"
        >
          Cancel
        </Button>
        <Button
          type="button"
          onClick={() => {
            // Normalize empty strings to null for optional fields
            const payload: WinnerPayload = {
              ...form,
              competitionId: form.competitionId || null,
              imageUrl: form.imageUrl || null,
            };
            onSubmit(payload);
          }}
          disabled={isLoading || !form.userId || !form.prizeDescription || !form.prizeValue}
          data-testid="button-submit"
        >
          {isLoading ? "Saving..." : data ? "Update Winner" : "Add Winner"}
        </Button>
      </DialogFooter>
    </div>
  );
}

export default function AdminPastWinners() {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingWinner, setEditingWinner] = useState<Winner | undefined>();
  const [deletingWinner, setDeletingWinner] = useState<Winner | undefined>();

  // Fetch winners with user and competition details
  const { data: winnersData = [], isLoading } = useQuery<WinnerWithDetails[]>({
    queryKey: ["/api/admin/winners"],
  });

  // Create winner mutation
  const createMutation = useMutation({
    mutationFn: async (data: WinnerPayload) => {
      return await apiRequest("/api/admin/winners", "POST", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/winners"] });
      queryClient.invalidateQueries({ queryKey: ["/api/winners"] });
      toast({
        title: "Success",
        description: "Winner added successfully",
      });
      setDialogOpen(false);
      setEditingWinner(undefined);
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to add winner",
      });
    },
  });

  // Update winner mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: WinnerPayload }) => {
      return await apiRequest(`/api/admin/winners/${id}`, "PATCH", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/winners"] });
      queryClient.invalidateQueries({ queryKey: ["/api/winners"] });
      toast({
        title: "Success",
        description: "Winner updated successfully",
      });
      setDialogOpen(false);
      setEditingWinner(undefined);
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update winner",
      });
    },
  });

  // Delete winner mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest(`/api/admin/winners/${id}`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/winners"] });
      queryClient.invalidateQueries({ queryKey: ["/api/winners"] });
      toast({
        title: "Success",
        description: "Winner deleted successfully",
      });
      setDeletingWinner(undefined);
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to delete winner",
      });
    },
  });

  const handleSubmit = (payload: WinnerPayload) => {
    if (editingWinner) {
      updateMutation.mutate({ id: editingWinner.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleEdit = (winner: WinnerWithDetails) => {
    setEditingWinner(winner.winners);
    setDialogOpen(true);
  };

  const handleDelete = (winner: WinnerWithDetails) => {
    setDeletingWinner(winner.winners);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Past Winners Management</h1>
          <Button
            onClick={() => {
              setEditingWinner(undefined);
              setDialogOpen(true);
            }}
            data-testid="button-add-winner"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Winner
          </Button>
        </div>

        {isLoading ? (
          <div className="text-center py-8">Loading winners...</div>
        ) : winnersData.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No winners found. Add your first winner to get started.
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Winner</TableHead>
                  <TableHead>Competition</TableHead>
                  <TableHead>Prize Description</TableHead>
                  <TableHead>Prize Value</TableHead>
                  <TableHead>Date Added</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {winnersData.map((item) => (
                  <TableRow key={item.winners.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {item.users?.firstName} {item.users?.lastName}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {item.users?.email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {item.competitions?.title || (
                        <span className="text-muted-foreground">No competition</span>
                      )}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {item.winners.prizeDescription}
                    </TableCell>
                    <TableCell className="font-semibold text-primary">
                      {item.winners.prizeValue}
                    </TableCell>
                    <TableCell>
                      {new Date(item.winners.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(item)}
                          data-testid={`button-edit-${item.winners.id}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(item)}
                          data-testid={`button-delete-${item.winners.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Add/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingWinner ? "Edit Winner" : "Add New Winner"}
              </DialogTitle>
            </DialogHeader>
            <WinnerForm
              data={editingWinner}
              onSubmit={handleSubmit}
              onCancel={() => {
                setDialogOpen(false);
                setEditingWinner(undefined);
              }}
              isLoading={createMutation.isPending || updateMutation.isPending}
            />
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog
          open={!!deletingWinner}
          onOpenChange={(open) => !open && setDeletingWinner(undefined)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete this winner from the showcase. This
                action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel data-testid="button-cancel-delete">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deletingWinner && deleteMutation.mutate(deletingWinner.id)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                data-testid="button-confirm-delete"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
}
