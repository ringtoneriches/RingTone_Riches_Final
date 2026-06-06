// components/admin/AdminTicketManager.tsx
import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Competition } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import {
  Ticket,
  Edit2,
  Save,
  X,
  AlertCircle,
  Loader2,
  Infinity,
} from "lucide-react";

interface AdminTicketManagerProps {
  competition: Competition;
  onClose?: () => void;
}

export default function AdminTicketManager({ competition, onClose }: AdminTicketManagerProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [newMaxTickets, setNewMaxTickets] = useState<number | null>(competition?.maxTickets || null);
  const [isUnlimited, setIsUnlimited] = useState(!competition?.maxTickets || competition.maxTickets === 0);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingValue, setPendingValue] = useState<number | null>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Guard clause - if no competition, return null
  if (!competition) {
    return null;
  }

  const soldTickets = competition.soldTickets || 0;
  const currentMaxTickets = competition.maxTickets || 0;
  const isUnlimitedTickets = !currentMaxTickets || currentMaxTickets === 0;
  const availableTickets = isUnlimitedTickets ? Infinity : currentMaxTickets - soldTickets;
  const isSoldOut = !isUnlimitedTickets && availableTickets <= 0;
  const isAlmostFull = !isUnlimitedTickets && availableTickets > 0 && availableTickets / (currentMaxTickets || 1) < 0.1;

  // Mutation for updating tickets
  const updateTicketsMutation = useMutation({
    mutationFn: async (maxTickets: number | null) => {
      const response = await apiRequest(
        `/api/admin/competitions/${competition.id}/tickets`,
        "PATCH",
        { maxTickets: maxTickets === null ? 0 : maxTickets }
      );
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Success!",
        description: data.message || "Tickets updated successfully",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/competitions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/competitions"] });
      setIsEditing(false);
      setShowConfirmDialog(false);
      if (onClose) onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update tickets",
        variant: "destructive",
      });
    },
  });

  const handleEditClick = () => {
    setNewMaxTickets(isUnlimitedTickets ? null : currentMaxTickets);
    setIsUnlimited(isUnlimitedTickets);
    setIsEditing(true);
  };

  const handleSaveClick = () => {
    if (isUnlimited) {
      setPendingValue(null);
      setShowConfirmDialog(true);
      return;
    }

    if (!newMaxTickets || newMaxTickets === 0) {
      toast({
        title: "Invalid Value",
        description: "Please enter a number greater than 0 or select 'Unlimited'",
        variant: "destructive",
      });
      return;
    }

    if (newMaxTickets === currentMaxTickets && !isUnlimited) {
      setIsEditing(false);
      return;
    }

    if (newMaxTickets < soldTickets) {
      toast({
        title: "Invalid Value",
        description: `Cannot set max tickets below current sold tickets (${soldTickets.toLocaleString()})`,
        variant: "destructive",
      });
      return;
    }

    if (newMaxTickets < 0) {
      toast({
        title: "Invalid Value",
        description: "Max tickets cannot be negative",
        variant: "destructive",
      });
      return;
    }

    setPendingValue(newMaxTickets);
    setShowConfirmDialog(true);
  };

  const handleConfirmUpdate = () => {
    updateTicketsMutation.mutate(pendingValue);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setNewMaxTickets(isUnlimitedTickets ? null : currentMaxTickets);
    setIsUnlimited(isUnlimitedTickets);
  };

  const handleUnlimitedToggle = () => {
    setIsUnlimited(!isUnlimited);
    if (!isUnlimited) {
      setNewMaxTickets(null);
    } else {
      setNewMaxTickets(currentMaxTickets || 100);
    }
  };

  const getTicketStatusColor = () => {
    if (isUnlimitedTickets) return "text-green-400";
    if (isSoldOut) return "text-red-400";
    if (isAlmostFull) return "text-orange-400";
    return "text-green-400";
  };

  const getProgressPercentage = () => {
    if (isUnlimitedTickets || !currentMaxTickets) return 0;
    return (soldTickets / currentMaxTickets) * 100;
  };

  // Quick actions
  const quickActions = [
    { label: "+10%", multiplier: 1.1 },
    { label: "+25%", multiplier: 1.25 },
    { label: "+50%", multiplier: 1.5 },
    { label: "Double", multiplier: 2 },
    { label: "Round Up", action: () => {
        if (newMaxTickets) {
          const rounded = Math.ceil(newMaxTickets / 100) * 100;
          setNewMaxTickets(Math.max(rounded, newMaxTickets));
        }
      }
    },
  ];

  const handleQuickAction = (multiplier?: number, action?: () => void) => {
    if (action) {
      action();
    } else if (multiplier && newMaxTickets) {
      const newValue = Math.floor(newMaxTickets * multiplier);
      setNewMaxTickets(Math.max(newValue, soldTickets));
    }
  };

  return (
    <>
      <Card className="bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700 w-full max-w-full overflow-hidden">
        <CardHeader className="px-3 sm:px-6 py-3 sm:py-6">
          {/* Header - Stack on mobile, row on desktop */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
            <div className="min-w-0 flex-1">
              <CardTitle className="text-white flex items-center gap-2 text-base sm:text-lg md:text-xl">
                <Ticket className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500 flex-shrink-0" />
                <span className="truncate">Ticket Management</span>
              </CardTitle>
              <CardDescription className="text-gray-400 text-xs sm:text-sm mt-1 truncate">
                {competition.title}
              </CardDescription>
            </div>
            {!isEditing && (
              <Button
                onClick={handleEditClick}
                variant="outline"
                size="sm"
                className="border-gray-600 text-gray-300 hover:bg-gray-700 w-full sm:w-auto text-xs sm:text-sm"
                disabled={!competition.isActive || competition.isArchived}
              >
                <Edit2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5" />
                Edit Tickets
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4 sm:space-y-6 px-3 sm:px-6 pb-4 sm:pb-6">
          {/* Stats Grid - 1 col mobile, 3 cols desktop */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4">
            {/* Total Tickets */}
            <div className="bg-gray-800/50 rounded-lg p-3 sm:p-4 border border-gray-700">
              <div className="text-xs sm:text-sm text-gray-400 mb-1">Total Tickets</div>
              <div className="text-lg sm:text-xl md:text-2xl font-bold text-white flex items-center gap-1.5 sm:gap-2">
                {isUnlimitedTickets ? (
                  <>
                    <Infinity className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-green-400 flex-shrink-0" />
                    <span className="text-green-400 text-sm sm:text-base md:text-lg">Unlimited</span>
                  </>
                ) : (
                  <span className="text-sm sm:text-base md:text-lg">{currentMaxTickets.toLocaleString()}</span>
                )}
              </div>
            </div>
            
            {/* Sold Tickets */}
            <div className="bg-gray-800/50 rounded-lg p-3 sm:p-4 border border-gray-700">
              <div className="text-xs sm:text-sm text-gray-400 mb-1">Sold Tickets</div>
              <div className="text-lg sm:text-xl md:text-2xl font-bold text-blue-400 text-sm sm:text-base md:text-lg">
                {soldTickets.toLocaleString()}
              </div>
            </div>
            
            {/* Available */}
            <div className="bg-gray-800/50 rounded-lg p-3 sm:p-4 border border-gray-700">
              <div className="text-xs sm:text-sm text-gray-400 mb-1">Available</div>
              <div className={`text-lg sm:text-xl md:text-2xl font-bold ${getTicketStatusColor()} text-sm sm:text-base md:text-lg`}>
                {isUnlimitedTickets ? (
                  <span className="flex items-center gap-1.5 sm:gap-2">
                    <Infinity className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 flex-shrink-0" />
                    <span>Unlimited</span>
                  </span>
                ) : (
                  availableTickets.toLocaleString()
                )}
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {isSoldOut && (
                  <Badge variant="destructive" className="text-[10px] sm:text-xs">
                    Sold Out
                  </Badge>
                )}
                {isAlmostFull && !isSoldOut && (
                  <Badge className="text-[10px] sm:text-xs bg-orange-500">
                    Almost Full
                  </Badge>
                )}
                {isUnlimitedTickets && (
                  <Badge className="text-[10px] sm:text-xs bg-green-500">
                    <Infinity className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-1" />
                    Unlimited
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          {!isUnlimitedTickets && currentMaxTickets > 0 && (
            <div className="space-y-1.5 sm:space-y-2">
              <div className="flex justify-between text-xs sm:text-sm">
                <span className="text-gray-400">Fill Rate</span>
                <span className="text-white font-semibold">
                  {getProgressPercentage().toFixed(1)}%
                </span>
              </div>
              <div className="h-1.5 sm:h-2 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-yellow-500 to-orange-500 transition-all duration-500"
                  style={{ width: `${getProgressPercentage()}%` }}
                />
              </div>
            </div>
          )}

          {/* Unlimited indicator */}
          {isUnlimitedTickets && (
            <div className="bg-green-900/20 border border-green-800 rounded-lg p-2.5 sm:p-3">
              <div className="flex items-center gap-2 text-green-400">
                <Infinity className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                <span className="text-xs sm:text-sm font-semibold">
                  Unlimited tickets - No maximum limit set
                </span>
              </div>
            </div>
          )}

          {/* Edit Mode */}
          {isEditing && (
            <div className="border-t border-gray-700 pt-4 sm:pt-6 mt-3 sm:mt-4">
              <div className="space-y-4 sm:space-y-5">
                {/* Ticket Mode Toggle */}
                <div>
                  <Label className="text-gray-300 mb-2 sm:mb-3 block text-xs sm:text-sm">Ticket Mode</Label>
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                    <Button
                      onClick={handleUnlimitedToggle}
                      variant={isUnlimited ? "default" : "outline"}
                      size="sm"
                      className={`text-xs sm:text-sm w-full sm:w-auto ${
                        isUnlimited 
                          ? "bg-green-600 hover:bg-green-700 text-white" 
                          : "border-gray-600 text-gray-300 hover:bg-gray-700"
                      }`}
                    >
                      <Infinity className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5" />
                      Unlimited
                    </Button>
                    <Button
                      onClick={() => setIsUnlimited(false)}
                      variant={!isUnlimited ? "default" : "outline"}
                      size="sm"
                      className={`text-xs sm:text-sm w-full sm:w-auto ${
                        !isUnlimited 
                          ? "bg-blue-600 hover:bg-blue-700 text-white" 
                          : "border-gray-600 text-gray-300 hover:bg-gray-700"
                      }`}
                    >
                      <Ticket className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5" />
                      Limited
                    </Button>
                  </div>
                </div>

                {/* Ticket Input - Limited mode */}
                {!isUnlimited && (
                  <div>
                    <Label htmlFor="maxTickets" className="text-gray-300 mb-1.5 sm:mb-2 block text-xs sm:text-sm">
                      New Total Ticket Limit
                    </Label>
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                      <div className="flex-1">
                        <Input
                          id="maxTickets"
                          type="number"
                          value={newMaxTickets || ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === "") {
                              setNewMaxTickets(null);
                              setIsUnlimited(true);
                            } else {
                              setNewMaxTickets(parseInt(val) || 0);
                              setIsUnlimited(false);
                            }
                          }}
                          min={soldTickets}
                          className="bg-gray-800 border-gray-600 text-white text-xs sm:text-sm h-9 sm:h-10"
                          placeholder="Enter max tickets"
                        />
                        {newMaxTickets !== null && newMaxTickets < soldTickets && (
                          <p className="text-red-400 text-[10px] sm:text-xs mt-1 flex items-center gap-1">
                            <AlertCircle className="w-2.5 h-2.5 sm:w-3 sm:h-3 flex-shrink-0" />
                            Cannot be less than sold tickets ({soldTickets.toLocaleString()})
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={handleSaveClick}
                          disabled={updateTicketsMutation.isPending || (!isUnlimited && newMaxTickets !== null && newMaxTickets < soldTickets)}
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 text-xs sm:text-sm flex-1 sm:flex-none"
                        >
                          {updateTicketsMutation.isPending ? (
                            <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />
                          ) : (
                            <Save className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                          )}
                          Save
                        </Button>
                        <Button
                          onClick={handleCancel}
                          variant="outline"
                          size="sm"
                          className="border-gray-600 text-gray-300 text-xs sm:text-sm flex-1 sm:flex-none"
                        >
                          <X className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Quick Actions */}
                {!isUnlimited && newMaxTickets !== null && (
                  <div>
                    <Label className="text-gray-300 mb-1.5 sm:mb-2 block text-xs sm:text-sm">Quick Actions</Label>
                    <div className="flex gap-1.5 sm:gap-2 flex-wrap">
                      {quickActions.map((action, idx) => (
                        <Button
                          key={idx}
                          variant="outline"
                          size="sm"
                          onClick={() => handleQuickAction(action.multiplier, action.action)}
                          className="border-gray-600 text-gray-300 hover:bg-gray-700 text-[10px] sm:text-xs px-2 sm:px-3 py-1 sm:py-1.5"
                        >
                          {action.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Save button for unlimited mode */}
                {isUnlimited && (
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                    <Button
                      onClick={handleSaveClick}
                      disabled={updateTicketsMutation.isPending}
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 text-xs sm:text-sm w-full sm:w-auto"
                    >
                      {updateTicketsMutation.isPending ? (
                        <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin mr-1.5" />
                      ) : (
                        <Save className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5" />
                      )}
                      Set as Unlimited
                    </Button>
                    <Button
                      onClick={handleCancel}
                      variant="outline"
                      size="sm"
                      className="border-gray-600 text-gray-300 text-xs sm:text-sm w-full sm:w-auto"
                    >
                      <X className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5" />
                      Cancel
                    </Button>
                  </div>
                )}

                {/* Info Box */}
                <div className="bg-blue-900/20 border border-blue-800 rounded-lg p-2.5 sm:p-3">
                  <div className="flex items-start gap-1.5 sm:gap-2">
                    <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                    <div className="text-[10px] sm:text-xs text-blue-300">
                      <p className="font-semibold mb-1">Important Notes:</p>
                      <ul className="list-disc list-inside space-y-0.5">
                        <li>Set to <strong>Unlimited</strong> for no ticket cap</li>
                        <li>Leave field empty to automatically set as Unlimited</li>
                        <li>Increasing tickets adds more available entries</li>
                        <li>Cannot reduce below already sold tickets</li>
                        <li>Changes affect new purchases only</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Status Warning */}
          {(!competition.isActive || competition.isArchived) && (
            <div className="bg-yellow-900/20 border border-yellow-800 rounded-lg p-2.5 sm:p-3">
              <div className="flex items-center gap-1.5 sm:gap-2 text-yellow-400">
                <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                <span className="text-[10px] sm:text-xs">
                  {!competition.isActive && "This competition is inactive. Activate it to allow ticket management."}
                  {competition.isArchived && "Archived competitions cannot be modified."}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent className="bg-gray-900 border-gray-700 w-[95vw] max-w-lg mx-auto">
          <AlertDialogHeader className="space-y-2 sm:space-y-3">
            <AlertDialogTitle className="text-white text-base sm:text-lg">
              Confirm Ticket Update
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400 text-xs sm:text-sm">
              {pendingValue === null ? (
                <>
                  Are you sure you want to set tickets to{" "}
                  <span className="font-semibold text-green-400 inline-flex items-center gap-1">
                    <Infinity className="w-3 h-3 sm:w-4 sm:h-4" />
                    Unlimited
                  </span>
                  ?
                </>
              ) : (
                <>
                  Are you sure you want to change the max tickets from{" "}
                  <span className="font-semibold text-white">
                    {isUnlimitedTickets ? (
                      <span className="inline-flex items-center gap-1">
                        <Infinity className="w-3 h-3" />
                        Unlimited
                      </span>
                    ) : (
                      currentMaxTickets.toLocaleString()
                    )}
                  </span>{" "}
                  to{" "}
                  <span className="font-semibold text-yellow-500">
                    {pendingValue.toLocaleString()}
                  </span>
                  ?
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="bg-gray-800 rounded-lg p-2.5 sm:p-3 my-2 sm:my-3">
            <div className="flex justify-between text-xs sm:text-sm mb-1.5 sm:mb-2">
              <span className="text-gray-400">Current Available:</span>
              <span className="text-white font-semibold">
                {isUnlimitedTickets ? (
                  <span className="flex items-center gap-1">
                    <Infinity className="w-3 h-3 text-green-400" />
                    Unlimited
                  </span>
                ) : (
                  availableTickets.toLocaleString()
                )}
              </span>
            </div>
            <div className="flex justify-between text-xs sm:text-sm">
              <span className="text-gray-400">New Available:</span>
              <span className="font-semibold text-green-400">
                {pendingValue === null ? (
                  <span className="flex items-center gap-1">
                    <Infinity className="w-3 h-3" />
                    Unlimited
                  </span>
                ) : (
                  `${(pendingValue - soldTickets).toLocaleString()} tickets`
                )}
              </span>
            </div>
          </div>
          
          <AlertDialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
            <AlertDialogCancel className="bg-gray-800 text-gray-300 border-gray-700 text-xs sm:text-sm w-full sm:w-auto mt-0">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmUpdate}
              className="bg-yellow-600 hover:bg-yellow-700 text-white text-xs sm:text-sm w-full sm:w-auto"
            >
              Confirm Update
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}