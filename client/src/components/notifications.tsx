import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Bell,
  CheckCheck,
  Trash2,
  Clock,
  Info,
  AlertCircle,
  CheckCircle,
  Award,
  Megaphone,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { format, formatDistanceToNow } from "date-fns";
import { Link } from "wouter";
import Header from "./layout/header";
import Footer from "./layout/footer";
import DigitalAtmosphere from "./home/DigitalAtmosphere";

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

const TYPE_META = {
  info: {
    icon: Info,
    badge: "bg-sky-500/15 text-sky-300 border-sky-500/25",
    iconWrap: "bg-sky-500/15 text-sky-300",
  },
  success: {
    icon: CheckCircle,
    badge: "bg-emerald-500/15 text-emerald-300 border-emerald-500/25",
    iconWrap: "bg-emerald-500/15 text-emerald-300",
  },
  warning: {
    icon: AlertCircle,
    badge: "bg-[#F1D47A]/15 text-[#F1D47A] border-[#F1D47A]/25",
    iconWrap: "bg-[#F1D47A]/15 text-[#F1D47A]",
  },
  promotion: {
    icon: Award,
    badge: "bg-[#C8102E]/15 text-[#FF263D] border-[#C8102E]/30",
    iconWrap: "bg-[#C8102E]/15 text-[#FF263D]",
  },
  system: {
    icon: Megaphone,
    badge: "bg-white/10 text-white/60 border-white/15",
    iconWrap: "bg-white/10 text-white/55",
  },
} as const;

export default function UserNotifications() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [clearAllDialog, setClearAllDialog] = useState(false);

  const { data: notifications, isLoading } = useQuery<Notification[]>({
    queryKey: ["/api/user/notifications"],
    queryFn: async () => {
      const res = await fetch("/api/user/notifications", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch notifications");
      return res.json();
    },
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      return apiRequest(`/api/user/notifications/${notificationId}/read`, "POST");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/notifications"] });
    },
  });

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

  const filteredNotifications =
    notifications?.filter((notification) => {
      if (filter === "unread" && notification.status === "read") return false;
      if (filter === "read" && notification.status !== "read") return false;
      if (typeFilter !== "all" && notification.notification.type !== typeFilter) return false;
      return true;
    }) || [];

  const unreadCount = notifications?.filter((n) => n.status !== "read").length || 0;

  const statusChips = [
    { id: "all", label: "All" },
    { id: "unread", label: "Unread" },
    { id: "read", label: "Read" },
  ];

  const typeChips = [
    { id: "all", label: "All types" },
    { id: "info", label: "Info" },
    { id: "success", label: "Success" },
    { id: "warning", label: "Warning" },
    { id: "promotion", label: "Promotion" },
    { id: "system", label: "System" },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#050505] text-white">
      <DigitalAtmosphere />
      <Header />

      <main className="relative z-10 mx-auto max-w-3xl px-4 pb-16 pt-6 sm:px-6 sm:pt-8">
        <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-start gap-3">
            <Link href="/">
              <Button
                variant="ghost"
                size="icon"
                className="mt-1 h-9 w-9 rounded-full border border-white/10 bg-white/[0.04] text-white hover:bg-white/10"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[#C8102E]/40 bg-[#C8102E]/10 px-3 py-1">
                <Bell className="h-3.5 w-3.5 text-[#F1D47A]" />
                <span className="text-[10px] font-black uppercase tracking-[0.22em] text-[#FF263D]">
                  Inbox
                </span>
              </div>
              <h1 className="font-prize text-4xl text-white sm:text-5xl">NOTIFICATIONS</h1>
              <p className="mt-1.5 text-sm text-white/50">
                {unreadCount > 0
                  ? `${unreadCount} unread ${unreadCount === 1 ? "message" : "messages"}`
                  : "You're all caught up"}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 sm:justify-end">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => markAllAsReadMutation.mutate()}
                disabled={markAllAsReadMutation.isPending}
                className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.04] px-3.5 py-2 text-[11px] font-black uppercase tracking-[0.14em] text-white/80 hover:border-[#F1D47A]/40 hover:text-[#F1D47A] disabled:opacity-50"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Mark all read
              </button>
            )}
            {notifications && notifications.length > 0 && (
              <button
                type="button"
                onClick={() => setClearAllDialog(true)}
                className="inline-flex items-center gap-2 rounded-full border border-[#C8102E]/40 bg-[#C8102E]/10 px-3.5 py-2 text-[11px] font-black uppercase tracking-[0.14em] text-[#FF263D] hover:bg-[#C8102E]/20"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Clear all
              </button>
            )}
          </div>
        </div>

        <div className="mb-5 space-y-2.5">
          <div className="flex flex-wrap gap-1.5">
            {statusChips.map((chip) => (
              <button
                key={chip.id}
                type="button"
                onClick={() => setFilter(chip.id)}
                className={`rounded-full px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.14em] transition ${
                  filter === chip.id
                    ? "bg-[#C8102E] text-white"
                    : "border border-white/10 bg-white/[0.04] text-white/50 hover:text-white"
                }`}
              >
                {chip.label}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {typeChips.map((chip) => (
              <button
                key={chip.id}
                type="button"
                onClick={() => setTypeFilter(chip.id)}
                className={`rounded-full px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.14em] transition ${
                  typeFilter === chip.id
                    ? "border border-[#F1D47A]/50 bg-[#F1D47A]/15 text-[#F1D47A]"
                    : "border border-white/10 bg-white/[0.04] text-white/50 hover:text-white"
                }`}
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-9 w-9 animate-spin rounded-full border-2 border-[#C8102E] border-t-transparent" />
          </div>
        ) : filteredNotifications.length > 0 ? (
          <div className="space-y-2.5">
            {filteredNotifications.map((notification) => {
              const type = notification.notification.type;
              const meta = TYPE_META[type] || TYPE_META.info;
              const Icon = meta.icon;
              const unread = notification.status !== "read";

              return (
                <button
                  key={notification.id}
                  type="button"
                  onClick={() => handleNotificationClick(notification)}
                  className={`group flex w-full gap-4 rounded-2xl border p-4 text-left transition sm:p-5 ${
                    unread
                      ? "border-[#C8102E]/35 bg-[#C8102E]/[0.07] hover:border-[#C8102E]/55"
                      : "border-white/8 bg-[#0A0A0D]/75 opacity-80 hover:opacity-100"
                  }`}
                >
                  <div
                    className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${meta.iconWrap}`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          {unread && (
                            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#FF263D]" />
                          )}
                          <h3 className="font-semibold text-white">{notification.notification.title}</h3>
                          <Badge variant="outline" className={`text-[10px] uppercase tracking-wide ${meta.badge}`}>
                            {type}
                          </Badge>
                          {unread ? (
                            <Badge className="border-0 bg-[#C8102E] text-[10px] uppercase text-white">New</Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-white/10 text-[10px] uppercase text-white/50">
                              Read
                            </Badge>
                          )}
                        </div>

                        <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-white/55">
                          {notification.notification.message}
                        </p>

                        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-white/35">
                          <span className="inline-flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDistanceToNow(new Date(notification.sentAt), { addSuffix: true })}
                          </span>
                          <span>{format(new Date(notification.sentAt), "MMM d, yyyy h:mm a")}</span>
                          {notification.readAt && (
                            <span className="inline-flex items-center gap-1">
                              <CheckCheck className="h-3 w-3" />
                              Read {formatDistanceToNow(new Date(notification.readAt), { addSuffix: true })}
                            </span>
                          )}
                        </div>
                      </div>

                      <span
                        role="button"
                        tabIndex={0}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white/30 hover:bg-white/10 hover:text-[#FF263D]"
                        onClick={(e) => {
                          e.stopPropagation();
                          clearNotificationMutation.mutate(notification.notificationId);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            e.stopPropagation();
                            clearNotificationMutation.mutate(notification.notificationId);
                          }
                        }}
                        aria-label="Remove notification"
                      >
                        <Trash2 className="h-4 w-4" />
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-white/10 bg-[#0A0A0D]/80 px-6 py-16 text-center">
            <Bell className="mx-auto mb-4 h-12 w-12 text-white/20" />
            <h3 className="font-prize text-2xl">No notifications</h3>
            <p className="mt-1.5 text-sm text-white/45">
              {filter !== "all" || typeFilter !== "all"
                ? "Try changing your filters"
                : "You're all caught up"}
            </p>
          </div>
        )}

        <AlertDialog open={clearAllDialog} onOpenChange={setClearAllDialog}>
          <AlertDialogContent className="border-white/10 bg-[#0A0A0D] text-white">
            <AlertDialogHeader>
              <AlertDialogTitle className="font-prize text-2xl">Clear all notifications?</AlertDialogTitle>
              <AlertDialogDescription className="text-white/50">
                This will permanently remove all your notifications. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="border-white/15 bg-transparent text-white hover:bg-white/10">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => clearAllMutation.mutate()}
                className="bg-[#C8102E] text-white hover:bg-[#FF263D]"
              >
                {clearAllMutation.isPending ? "Clearing..." : "Clear all"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>

      <Footer />
    </div>
  );
}
