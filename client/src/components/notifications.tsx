// client/src/pages/user/notifications.tsx
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Bell, CheckCheck, Trash2, Clock, Info, AlertCircle, 
  CheckCircle, Award, Megaphone, ArrowLeft, Filter
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format, formatDistanceToNow } from "date-fns";
import { Link } from "wouter";
import Header from "./layout/header";

interface Notification {
  id: string;
  notificationId: string;
  status: "pending" | "sent" | "delivered" | "read" | "failed";
  readAt: string | null;
  sentAt: string;
  createdAt: string;
  notification: {
    id: string;
    title: string;
    message: string;
    type: "info" | "success" | "warning" | "promotion" | "system";
    sentAt: string;
  };
}

export default function UserNotifications() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [clearAllDialog, setClearAllDialog] = useState(false);

  // Fetch user's notifications
  const { data: notifications, isLoading } = useQuery<Notification[]>({
    queryKey: ["/api/user/notifications"],
    queryFn: async () => {
      const res = await fetch("/api/user/notifications", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch notifications");
      return res.json();
    },
  });

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      return apiRequest(`/api/user/notifications/${notificationId}/read`, "POST");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/notifications"] });
    },
  });

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("/api/user/notifications/read-all", "POST");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/notifications"] });
      toast({
        title: "Success",
        description: "All notifications marked as read",
      });
    },
  });

  // Clear/delete notification mutation
  const clearNotificationMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      return apiRequest(`/api/user/notifications/${notificationId}`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/notifications"] });
      toast({
        title: "Success",
        description: "Notification removed",
      });
    },
  });

  // Clear all notifications mutation
  const clearAllMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("/api/user/notifications/clear-all", "POST");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/notifications"] });
      setClearAllDialog(false);
      toast({
        title: "Success",
        description: "All notifications cleared",
      });
    },
  });

  const handleNotificationClick = (notification: Notification) => {
    if (notification.status !== "read") {
      markAsReadMutation.mutate(notification.notificationId);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "info": return <Info className="w-5 h-5 text-blue-500" />;
      case "success": return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "warning": return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case "promotion": return <Award className="w-5 h-5 text-purple-500" />;
      case "system": return <Megaphone className="w-5 h-5 text-gray-500" />;
      default: return <Bell className="w-5 h-5" />;
    }
  };

  const getTypeBadge = (type: string) => {
    const colors = {
      info: "bg-blue-500/10 text-blue-500 border-blue-500/20",
      success: "bg-green-500/10 text-green-500 border-green-500/20",
      warning: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
      promotion: "bg-purple-500/10 text-purple-500 border-purple-500/20",
      system: "bg-gray-500/10 text-gray-500 border-gray-500/20",
    };
    return colors[type as keyof typeof colors] || colors.info;
  };

  // Filter notifications
  const filteredNotifications = notifications?.filter((notification) => {
    // Status filter
    if (filter === "unread" && notification.status === "read") return false;
    if (filter === "read" && notification.status !== "read") return false;
    
    // Type filter
    if (typeFilter !== "all" && notification.notification.type !== typeFilter) return false;
    
    return true;
  }) || [];

  const unreadCount = notifications?.filter(n => n.status !== "read").length || 0;

  return (
    <>
    <Header/>
    <div className="container max-w-4xl mx-auto py-6 px-4">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          <p className="text-sm text-muted-foreground">
            You have {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex gap-2 flex-1">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[140px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="unread">Unread</SelectItem>
              <SelectItem value="read">Read</SelectItem>
            </SelectContent>
          </Select>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="info">Info</SelectItem>
              <SelectItem value="success">Success</SelectItem>
              <SelectItem value="warning">Warning</SelectItem>
              <SelectItem value="promotion">Promotion</SelectItem>
              <SelectItem value="system">System</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2">
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => markAllAsReadMutation.mutate()}
              disabled={markAllAsReadMutation.isPending}
              className="gap-2"
            >
              <CheckCheck className="w-4 h-4" />
              Mark all read
            </Button>
          )}
          
          {notifications && notifications.length > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setClearAllDialog(true)}
              className="gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Clear all
            </Button>
          )}
        </div>
      </div>

      {/* Notifications List */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      ) : filteredNotifications.length > 0 ? (
        <div className="space-y-3">
          {filteredNotifications.map((notification) => (
            <Card 
              key={notification.id}
              className={`hover:shadow-md transition-shadow cursor-pointer ${
                notification.status === "read" ? "opacity-75" : ""
              }`}
              onClick={() => handleNotificationClick(notification)}
            >
              <CardContent className="p-4">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 mt-1">
                    {getIcon(notification.notification.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold">
                            {notification.notification.title}
                          </h3>
                          <Badge variant="outline" className={`text-xs ${getTypeBadge(notification.notification.type)}`}>
                            {notification.notification.type}
                          </Badge>
                          {notification.status === "read" ? (
                            <Badge variant="secondary" className="text-xs">Read</Badge>
                          ) : (
                            <Badge className="text-xs bg-blue-500">New</Badge>
                          )}
                        </div>
                        
                        <p className="text-sm text-muted-foreground mt-2 whitespace-pre-wrap">
                          {notification.notification.message}
                        </p>
                        
                        <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDistanceToNow(new Date(notification.sentAt), { addSuffix: true })}
                          </span>
                          <span>
                            {format(new Date(notification.sentAt), "MMM d, yyyy h:mm a")}
                          </span>
                          {notification.readAt && (
                            <span className="flex items-center gap-1">
                              <CheckCheck className="w-3 h-3" />
                              Read {formatDistanceToNow(new Date(notification.readAt), { addSuffix: true })}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 flex-shrink-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          clearNotificationMutation.mutate(notification.notificationId);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center">
          <div className="flex flex-col items-center justify-center">
            <Bell className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No notifications</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {filter !== "all" ? "Try changing your filters" : "You're all caught up!"}
            </p>
          </div>
        </Card>
      )}

      {/* Clear All Confirmation Dialog */}
      <AlertDialog open={clearAllDialog} onOpenChange={setClearAllDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear all notifications?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove all your notifications. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => clearAllMutation.mutate()}
              className="bg-red-600 hover:bg-red-700"
            >
              {clearAllMutation.isPending ? "Clearing..." : "Clear all"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
    
    </>
  );
}