// admin-competition-videos.tsx
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Video,
  Play,
  Upload,
  X,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  ExternalLink,
  FileVideo,
  Download
} from "lucide-react";
import AdminLayout from "@/components/admin/admin-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Competition {
  id: string;
  title: string;
  name: string;
  status: string;
  type: string;
  description?: string;
  videoUrl?: string;
  videoKey?: string;
  videoMimeType?: string;
  videoSize?: number;
  videoUpdatedAt?: string;
  videoThumbnailUrl?: string;
  videoDuration?: number;
}

interface VideoData {
  url: string;
  key: string;
  size: number;
  mimeType: string;
  thumbnailUrl?: string;
  duration?: number;
}

export default function AdminCompetitionVideos() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [selectedCompetition, setSelectedCompetition] = useState<string>("");
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedVideoCompetition, setSelectedVideoCompetition] = useState<Competition | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // Fetch competitions (only those that can have videos - instant win types)
  const { data: competitions = [], isLoading: competitionsLoading } = useQuery<Competition[]>({
    queryKey: ["/api/admin/competitions"],
    queryFn: async () => {
      const res = await fetch("/api/admin/competitions", {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch competitions");
      const allCompetitions = await res.json();
      
      
     return allCompetitions.filter((comp: Competition) => 
  comp.type?.toLowerCase() === "instant"
);
    },
  });

 const { data: competitionsWithVideos = [], refetch: refetchVideos } = useQuery<Competition[]>({
  queryKey: ["/api/promo-competitions/with-videos"],
  queryFn: async () => {
    const res = await fetch("/api/promo-competitions/with-videos", {
      credentials: "include",
    }); 
    if (!res.ok) throw new Error("Failed to fetch competitions with videos");
    const data = await res.json();
    return data;
  },
});

  // Upload video mutation
  const uploadMutation = useMutation({
    mutationFn: async ({ competitionId, file }: { competitionId: string; file: File }) => {
      const formData = new FormData();
      formData.append('video', file);
      
      // Custom upload with progress tracking
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const progress = (event.loaded / event.total) * 100;
            setUploadProgress(progress);
          }
        });
        
        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(JSON.parse(xhr.responseText));
          } else {
            reject(new Error('Upload failed'));
          }
        });
        
        xhr.addEventListener('error', () => reject(new Error('Upload failed')));
        
        xhr.open('POST', `/api/promo-competitions/${competitionId}/video`);
        xhr.withCredentials = true;
        xhr.send(formData);
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/promo-competitions/with-videos"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/competitions"] });
      setIsUploadDialogOpen(false);
      setSelectedFile(null);
      setUploadProgress(0);
      setUploading(false);
      toast({
        title: "Success",
        description: "Video uploaded successfully!",
      });
      refetchVideos();
    },
    onError: (error) => {
      setUploading(false);
      toast({
        title: "Error",
        description: "Failed to upload video. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Delete video mutation
  const deleteMutation = useMutation({
    mutationFn: async (competitionId: string) => {
      const res = await fetch(`/api/promo-competitions/${competitionId}/video`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete video");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/promo-competitions/with-videos"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/competitions"] });
      setIsDeleteDialogOpen(false);
      setSelectedVideoCompetition(null);
      toast({
        title: "Success",
        description: "Video deleted successfully!",
      });
      refetchVideos();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete video",
        variant: "destructive",
      });
    },
  });

  // Filter competitions
  const filteredCompetitions = useMemo(() => {
    if (!competitions) return [];
    return competitions.filter((comp) =>
      comp.title?.toLowerCase().includes(search.toLowerCase()) ||
      comp.type?.toLowerCase().includes(search.toLowerCase())
    );
  }, [competitions, search]);

  // Get video status badge
  const getVideoStatus = (competition: Competition) => {
    if (competition.videoUrl) {
      return { label: "Video Uploaded", variant: "success" as const, icon: CheckCircle };
    }
    return { label: "No Video", variant: "secondary" as const, icon: AlertCircle };
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('video/')) {
      toast({
        title: "Invalid File Type",
        description: "Please select a valid video file (MP4, MOV, AVI, etc.)",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (100MB)
    if (file.size > 100 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Video file must be less than 100MB",
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedCompetition || !selectedFile) return;
    
    setUploading(true);
    setUploadProgress(0);
    
    await uploadMutation.mutateAsync({
      competitionId: selectedCompetition,
      file: selectedFile,
    });
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "N/A";
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Byte';
    const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)).toString());
    return Math.round(bytes / Math.pow(1024, i)) + ' ' + sizes[i];
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return "N/A";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (competitionsLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </AdminLayout>
    );
  }

  const hasVideos = competitionsWithVideos.length > 0;

  return (
    <AdminLayout>
      <div className="space-y-4 md:space-y-6 px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:gap-4 md:flex-row md:justify-between md:items-center">
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold flex items-center gap-2">
              <Video className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-primary" />
              Competition Promo Videos
            </h1>
            <p className="text-xs sm:text-sm md:text-base text-muted-foreground mt-1">
              Upload and manage promotional videos for instant win competitions
            </p>
          </div>
        </div>

        {/* Statistics Cards - Responsive Grid */}
        <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="pt-4 sm:pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Total Competitions</p>
                  <p className="text-xl sm:text-2xl font-bold">{competitions.length}</p>
                </div>
                <Video className="w-6 h-6 sm:w-8 sm:h-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="pt-4 sm:pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">With Videos</p>
                  <p className="text-xl sm:text-2xl font-bold text-green-600">{competitionsWithVideos.length}</p>
                </div>
                <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow xs:col-span-2 lg:col-span-1">
            <CardContent className="pt-4 sm:pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Missing Videos</p>
                  <p className="text-xl sm:text-2xl font-bold text-yellow-600">{competitions.length - competitionsWithVideos.length}</p>
                </div>
                <AlertCircle className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter - Responsive Layout */}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <Input
              placeholder="Search competitions by name or type..."
              className="pl-9 sm:pl-10 w-full text-sm sm:text-base"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          
          <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto">
                <Upload className="w-4 h-4 mr-2" />
                Upload Video
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] w-[95vw] max-h-[90vh] overflow-y-auto p-4 sm:p-6">
              <DialogHeader>
                <DialogTitle className="text-lg sm:text-xl">Upload Promo Video</DialogTitle>
                <DialogDescription className="text-sm">
                  Upload a promotional video for an instant win competition
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label className="text-sm font-medium">Select Competition</Label>
                  <Select value={selectedCompetition} onValueChange={setSelectedCompetition}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Choose a competition" />
                    </SelectTrigger>
                    <SelectContent>
                      {competitions.map((comp) => (
                        <SelectItem key={comp.id} value={comp.id}>
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <span className="text-sm truncate max-w-[150px] sm:max-w-none">{comp.title}</span>
                            {comp.videoUrl && (
                              <Badge variant="success" className="text-xs whitespace-nowrap">
                                Has Video
                              </Badge>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label className="text-sm font-medium">Video File</Label>
                  <div className="border-2 border-dashed rounded-lg p-4 sm:p-6 text-center">
                    <input
                      type="file"
                      id="video-upload"
                      accept="video/*"
                      className="hidden"
                      onChange={handleFileSelect}
                    />
                    <label
                      htmlFor="video-upload"
                      className="cursor-pointer flex flex-col items-center gap-2"
                    >
                      <FileVideo className="w-10 h-10 sm:w-12 sm:h-12 text-muted-foreground" />
                      <span className="text-xs sm:text-sm font-medium break-all text-center">
                        {selectedFile ? selectedFile.name : "Click to select video"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        MP4, MOV, AVI, MKV, WebM (Max 100MB)
                      </span>
                    </label>
                  </div>
                </div>

                {uploading && (
                  <div className="space-y-2">
                    <Label className="text-sm">Upload Progress</Label>
                    <Progress value={uploadProgress} className="h-2" />
                    <p className="text-xs text-muted-foreground text-center">
                      {Math.round(uploadProgress)}% uploaded
                    </p>
                  </div>
                )}
              </div>
              <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsUploadDialogOpen(false);
                    setSelectedCompetition("");
                    setSelectedFile(null);
                    setUploadProgress(0);
                  }}
                  className="w-full sm:w-auto"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUpload}
                  disabled={!selectedCompetition || !selectedFile || uploading}
                  className="w-full sm:w-auto"
                >
                  {uploading ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Video
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Competitions Table */}
        <Card className="overflow-hidden">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-base sm:text-lg md:text-xl">Competitions</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Showing {filteredCompetitions.length} of {competitions.length} competitions
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {filteredCompetitions.length === 0 ? (
              <div className="text-center py-8 sm:py-12 px-4">
                <Video className="w-10 h-10 sm:w-12 sm:h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground">
                  {search ? "No competitions match your search" : "No competitions available"}
                </p>
              </div>
            ) : (
              <div className="border-t border-border">
                {/* Mobile Card View - Enhanced */}
                <div className="block md:hidden space-y-3 p-3 sm:p-4">
                  {filteredCompetitions.map((comp) => {
                    const status = getVideoStatus(comp);
                    const StatusIcon = status.icon;
                    return (
                      <Card key={comp.id} className="p-3 sm:p-4 hover:shadow-md transition-shadow">
                        <div className="space-y-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-sm sm:text-base break-words">
                                {comp.title}
                              </h3>
                              <p className="text-xs sm:text-sm text-muted-foreground capitalize mt-0.5">
                                {comp.type}
                              </p>
                            </div>
                            <Badge variant={status.variant} className="whitespace-nowrap text-xs">
                              <StatusIcon className="w-3 h-3 mr-1" />
                              {status.label}
                            </Badge>
                          </div>
                          
                          {comp.videoUrl && (
                            <div className="space-y-2">
                              <div className="bg-muted rounded-lg p-2 sm:p-3">
                                <div className="flex items-center gap-2 text-xs sm:text-sm">
                                  <Play className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                                  <span className="flex-1 truncate text-xs sm:text-sm">{comp.videoUrl.split('/').pop()}</span>
                                </div>
                                <div className="flex flex-wrap gap-2 mt-1.5 text-xs text-muted-foreground">
                                  {comp.videoDuration && (
                                    <span>Duration: {formatDuration(comp.videoDuration)}</span>
                                  )}
                                  {comp.videoSize && (
                                    <span>Size: {formatFileSize(comp.videoSize)}</span>
                                  )}
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="flex-1 text-xs sm:text-sm"
                                  onClick={() => {
                                    setSelectedVideoCompetition(comp);
                                    setIsViewDialogOpen(true);
                                  }}
                                >
                                  <Play className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                                  Preview
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  className="flex-1 text-xs sm:text-sm"
                                  onClick={() => {
                                    setSelectedVideoCompetition(comp);
                                    setIsDeleteDialogOpen(true);
                                  }}
                                >
                                  <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                                  Delete
                                </Button>
                              </div>
                            </div>
                          )}
                          
                          {!comp.videoUrl && (
                            <Button
                              size="sm"
                              className="w-full text-xs sm:text-sm"
                              onClick={() => {
                                setSelectedCompetition(comp.id);
                                setIsUploadDialogOpen(true);
                              }}
                            >
                              <Upload className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                              Upload Video
                            </Button>
                          )}
                        </div>
                      </Card>
                    );
                  })}
                </div>

                {/* Tablet/Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="whitespace-nowrap text-xs sm:text-sm">Competition</TableHead>
                        <TableHead className="whitespace-nowrap text-xs sm:text-sm">Type</TableHead>
                        <TableHead className="whitespace-nowrap text-xs sm:text-sm">Video Status</TableHead>
                        <TableHead className="whitespace-nowrap text-xs sm:text-sm">Video Details</TableHead>
                        <TableHead className="whitespace-nowrap text-xs sm:text-sm">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCompetitions.map((comp) => {
                        const status = getVideoStatus(comp);
                        const StatusIcon = status.icon;
                        return (
                          <TableRow key={comp.id}>
                            <TableCell className="font-medium text-sm">
                              <div className="flex items-center gap-2">
                                <Video className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                <span className="truncate max-w-[200px]">{comp.title}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-sm">
                              <Badge variant="outline" className="capitalize text-xs">
                                {comp.type}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant={status.variant} className="text-xs">
                                <StatusIcon className="w-3 h-3 mr-1" />
                                {status.label}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {comp.videoUrl ? (
                                <div className="space-y-1">
                                  <p className="text-xs truncate max-w-[180px] lg:max-w-[250px]">
                                    {comp.videoUrl.split('/').pop()}
                                  </p>
                                  {comp.videoDuration && (
                                    <p className="text-xs text-muted-foreground">
                                      Duration: {formatDuration(comp.videoDuration)}
                                    </p>
                                  )}
                                </div>
                              ) : (
                                <span className="text-muted-foreground text-xs">No video uploaded</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                {comp.videoUrl ? (
                                  <>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => {
                                        setSelectedVideoCompetition(comp);
                                        setIsViewDialogOpen(true);
                                      }}
                                      className="h-8 w-8 p-0"
                                    >
                                      <Play className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      onClick={() => {
                                        setSelectedVideoCompetition(comp);
                                        setIsDeleteDialogOpen(true);
                                      }}
                                      className="h-8 w-8 p-0"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </>
                                ) : (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setSelectedCompetition(comp.id);
                                      setIsUploadDialogOpen(true);
                                    }}
                                    className="text-xs"
                                  >
                                    <Upload className="w-3 h-3 mr-1" />
                                    Upload
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
              </div>
            )}
          </CardContent>
        </Card>

        {/* Video Preview Dialog - Responsive */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="sm:max-w-[800px] w-[95vw] max-h-[90vh] overflow-y-auto p-4 sm:p-6">
            <DialogHeader>
              <DialogTitle className="text-base sm:text-lg md:text-xl break-words">
                {selectedVideoCompetition?.title} - Promo Video
              </DialogTitle>
              <DialogDescription className="text-xs sm:text-sm">
                Preview the promotional video for this competition
              </DialogDescription>
            </DialogHeader>
            {selectedVideoCompetition?.videoUrl && (
              <div className="space-y-4">
                <div className="aspect-video bg-black rounded-lg overflow-hidden">
                  <video
                    controls
                    className="w-full h-full object-contain"
                    poster={selectedVideoCompetition.videoThumbnailUrl}
                  >
                    <source src={selectedVideoCompetition.videoUrl} type={selectedVideoCompetition.videoMimeType} />
                    Your browser does not support the video tag.
                  </video>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button
                    variant="outline"
                    className="flex-1 text-xs sm:text-sm"
                    onClick={() => window.open(selectedVideoCompetition.videoUrl, '_blank')}
                  >
                    <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                    Open in New Tab
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1 text-xs sm:text-sm"
                    onClick={() => {
                      setIsViewDialogOpen(false);
                      setIsDeleteDialogOpen(true);
                    }}
                  >
                    <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                    Delete Video
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog - Responsive */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent className="sm:max-w-[425px] w-[95vw] p-4 sm:p-6">
            <DialogHeader>
              <DialogTitle className="text-base sm:text-lg">Delete Promo Video</DialogTitle>
              <DialogDescription className="text-xs sm:text-sm break-words">
                Are you sure you want to delete the promo video for "{selectedVideoCompetition?.title}"? 
                This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={() => setIsDeleteDialogOpen(false)}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => selectedVideoCompetition && deleteMutation.mutate(selectedVideoCompetition.id)}
                disabled={deleteMutation.isPending}
                className="w-full sm:w-auto"
              >
                {deleteMutation.isPending && (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                )}
                Delete Video
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Empty State Alert */}
        {competitions.length === 0 && (
          <Alert className="text-xs sm:text-sm">
            <AlertCircle className="w-4 h-4" />
            <AlertDescription>
              No instant win competitions found. Please create competitions first before uploading promo videos.
            </AlertDescription>
          </Alert>
        )}
      </div>
    </AdminLayout>
  );
}