import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, CheckCheck, X, Clock, Info, AlertCircle, CheckCircle, Award, Megaphone, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { Link } from "wouter";

interface PushDelivery {
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
  };
}

export function NotificationsDropdown() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch user's notifications
  const { data: notifications, isLoading } = useQuery<PushDelivery[]>({
    queryKey: ["/api/user/notifications"],
    queryFn: async () => {
      const res = await fetch("/api/user/notifications", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch notifications");
      return res.json();
    },
    enabled: open,
  });

  // Fetch unread count
  const { data: countData } = useQuery<{ count: number }>({
    queryKey: ["/api/user/notifications/unread-count"],
    queryFn: async () => {
      const res = await fetch("/api/user/notifications/unread-count", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch count");
      return res.json();
    },
    refetchInterval: 30000,
  });

  useEffect(() => {
    if (countData) {
      setUnreadCount(countData.count);
    }
  }, [countData]);

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      return apiRequest(`/api/user/notifications/${notificationId}/read`, "POST");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/notifications/unread-count"] });
    },
  });

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("/api/user/notifications/read-all", "POST");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/notifications/unread-count"] });
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
      queryClient.invalidateQueries({ queryKey: ["/api/user/notifications/unread-count"] });
    },
  });

  const handleNotificationClick = (notification: PushDelivery) => {
    if (notification.status !== "read") {
      markAsReadMutation.mutate(notification.notificationId);
    }
    // Navigate to full view - will be handled by Link
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
      info: "bg-blue-500/10 text-blue-500",
      success: "bg-green-500/10 text-green-500",
      warning: "bg-yellow-500/10 text-yellow-500",
      promotion: "bg-purple-500/10 text-purple-500",
      system: "bg-gray-500/10 text-gray-500",
    };
    return colors[type as keyof typeof colors] || colors.info;
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative hover:bg-yellow-500/20">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="w-80 sm:w-96 [&_.hover\\:bg-muted\\/50]:hover:bg-yellow-500/20"
        sideOffset={5}
        alignOffset={-10}
      >
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">Notifications</h3>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 gap-1 text-xs hover:bg-yellow-500/20"
                onClick={() => markAllAsReadMutation.mutate()}
                disabled={markAllAsReadMutation.isPending}
              >
                <CheckCheck className="w-3 h-3" />
                Mark all read
              </Button>
            )}
            <Link href="/notifications">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 hover:bg-yellow-500/20"
                onClick={() => setOpen(false)}
              >
                <ExternalLink className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>

        <ScrollArea className="h-[400px]">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          ) : notifications && notifications.length > 0 ? (
            <div className="divide-y">
              {notifications.slice(0, 5).map((notification) => (
                <Link 
                  key={notification.id} 
                  href="/notifications"
                  onClick={() => {
                    handleNotificationClick(notification);
                    setOpen(false);
                  }}
                >
                  <div
                    className={`p-4 hover:bg-yellow-500/20 cursor-pointer transition-colors ${
                      notification.status === "read" ? "opacity-75" : ""
                    }`}
                  >
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 mt-1">
                        {getIcon(notification.notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <p className="text-sm font-medium">
                              {notification.notification.title}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              {notification.notification.message}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 flex-shrink-0 hover:bg-yellow-500/20"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              clearNotificationMutation.mutate(notification.notificationId);
                            }}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${getTypeBadge(notification.notification.type)}`}>
                            {notification.notification.type}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDistanceToNow(new Date(notification.sentAt), { addSuffix: true })}
                          </span>
                          {notification.status === "read" ? (
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                              Read
                            </Badge>
                          ) : (
                            <Badge className="text-[10px] px-1.5 py-0 bg-blue-500">
                              New
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
              
              {notifications.length > 5 && (
                <Link href="/notifications">
                  <div 
                    className="p-3 text-center text-sm text-primary hover:bg-yellow-500/20 cursor-pointer border-t"
                    onClick={() => setOpen(false)}
                  >
                    View all {notifications.length} notifications
                  </div>
                </Link>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-32 text-center p-4">
              <Bell className="w-8 h-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">No notifications</p>
            </div>
          )}
        </ScrollArea>
        
        <div className="p-2 border-t">
          <Link href="/notifications">
            <Button 
              variant="ghost" 
              className="w-full text-sm gap-2 hover:bg-yellow-500/20"
              onClick={() => setOpen(false)}
            >
              <ExternalLink className="w-4 h-4" />
              View all notifications
            </Button>
          </Link>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}