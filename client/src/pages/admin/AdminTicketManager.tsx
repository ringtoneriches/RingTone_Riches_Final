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
  Users,
} from "lucide-react";

interface AdminTicketManagerProps {
  competition: Competition;
  onClose?: () => void;
}

export default function AdminTicketManager({ competition, onClose }: AdminTicketManagerProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [newMaxTickets, setNewMaxTickets] = useState<number | null>(competition?.maxTickets || null);
  const [newSoldTickets, setNewSoldTickets] = useState<number>(competition?.soldTickets || 0);
  const [isUnlimited, setIsUnlimited] = useState(!competition?.maxTickets || competition.maxTickets === 0);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingMaxTickets, setPendingMaxTickets] = useState<number | null>(null);
  const [pendingSoldTickets, setPendingSoldTickets] = useState<number>(0);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

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
    mutationFn: async (data: { maxTickets?: number | null; soldTickets?: number }) => {
      const body: any = {};
      if (data.maxTickets !== undefined) {
        body.maxTickets = data.maxTickets === null ? 0 : data.maxTickets;
      }
      if (data.soldTickets !== undefined) {
        body.soldTickets = data.soldTickets;
      }
      
      const response = await apiRequest(
        `/api/admin/competitions/${competition.id}/tickets`,
        "PATCH",
        body
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
    setNewSoldTickets(soldTickets);
    setIsUnlimited(isUnlimitedTickets);
    setIsEditing(true);
  };

  const handleSaveClick = () => {
    // Check if anything changed
    const maxChanged = isUnlimited 
      ? !isUnlimitedTickets 
      : (newMaxTickets !== currentMaxTickets);
    const soldChanged = newSoldTickets !== soldTickets;

    if (!maxChanged && !soldChanged) {
      setIsEditing(false);
      return;
    }

    // Validate sold tickets
    if (newSoldTickets < 0) {
      toast({
        title: "Invalid Value",
        description: "Sold tickets cannot be negative",
        variant: "destructive",
      });
      return;
    }

    // If limited, validate sold against max
    if (!isUnlimited && newMaxTickets !== null && newMaxTickets > 0) {
      if (newSoldTickets > newMaxTickets) {
        toast({
          title: "Invalid Value",
          description: `Sold tickets (${newSoldTickets}) cannot exceed max tickets (${newMaxTickets})`,
          variant: "destructive",
        });
        return;
      }
    }

    setPendingMaxTickets(isUnlimited ? null : newMaxTickets);
    setPendingSoldTickets(newSoldTickets);
    setShowConfirmDialog(true);
  };

  const handleConfirmUpdate = () => {
    const data: any = {};
    
    if (pendingMaxTickets !== undefined) {
      data.maxTickets = pendingMaxTickets;
    }
    if (pendingSoldTickets !== undefined) {
      data.soldTickets = pendingSoldTickets;
    }
    
    updateTicketsMutation.mutate(data);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setNewMaxTickets(isUnlimitedTickets ? null : currentMaxTickets);
    setNewSoldTickets(soldTickets);
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

  // Quick actions for max tickets
  const quickMaxActions = [
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

  // Quick actions for sold tickets
  const quickSoldActions = [
    { label: "+1", value: 1 },
    { label: "+5", value: 5 },
    { label: "+10", value: 10 },
    { label: "-1", value: -1 },
    { label: "-5", value: -5 },
  ];

  const handleMaxQuickAction = (multiplier?: number, action?: () => void) => {
    if (action) {
      action();
    } else if (multiplier && newMaxTickets) {
      const newValue = Math.floor(newMaxTickets * multiplier);
      setNewMaxTickets(Math.max(newValue, newSoldTickets));
    }
  };

  const handleSoldQuickAction = (value: number) => {
    const newValue = newSoldTickets + value;
    if (newValue < 0) return;
    if (!isUnlimited && newMaxTickets && newValue > newMaxTickets) return;
    setNewSoldTickets(newValue);
  };

  return (
    <>
      <Card className="bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700 w-full max-w-full overflow-hidden">
        <CardHeader className="px-3 sm:px-6 py-3 sm:py-6">
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
          {/* Stats Grid */}
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
                {/* MAX TICKETS SECTION */}
                <div>
                  <Label className="text-gray-300 mb-2 sm:mb-3 block text-xs sm:text-sm font-semibold flex items-center gap-2">
                    <Ticket className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-yellow-500" />
                    Total Ticket Limit
                  </Label>
                  
                  {/* Ticket Mode Toggle */}
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-3">
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

                  {/* Max Ticket Input - Limited mode */}
                  {!isUnlimited && (
                    <div>
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
                        min={newSoldTickets}
                        className="bg-gray-800 border-gray-600 text-white text-xs sm:text-sm h-9 sm:h-10"
                        placeholder="Enter max tickets"
                      />
                      {newMaxTickets !== null && newMaxTickets < newSoldTickets && (
                        <p className="text-red-400 text-[10px] sm:text-xs mt-1 flex items-center gap-1">
                          <AlertCircle className="w-2.5 h-2.5 sm:w-3 sm:h-3 flex-shrink-0" />
                          Cannot be less than sold tickets ({newSoldTickets.toLocaleString()})
                        </p>
                      )}
                    </div>
                  )}

                  {/* Quick Actions for Max */}
                  {!isUnlimited && newMaxTickets !== null && (
                    <div className="mt-2">
                      <Label className="text-gray-400 mb-1.5 block text-[10px] sm:text-xs">Quick Adjust</Label>
                      <div className="flex gap-1.5 sm:gap-2 flex-wrap">
                        {quickMaxActions.map((action, idx) => (
                          <Button
                            key={idx}
                            variant="outline"
                            size="sm"
                            onClick={() => handleMaxQuickAction(action.multiplier, action.action)}
                            className="border-gray-600 text-gray-300 hover:bg-gray-700 text-[10px] sm:text-xs px-2 sm:px-3 py-1 sm:py-1.5"
                          >
                            {action.label}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* SOLD TICKETS SECTION */}
                <div className="border-t border-gray-700 pt-4">
                  <Label className="text-gray-300 mb-2 sm:mb-3 block text-xs sm:text-sm font-semibold flex items-center gap-2">
                    <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-400" />
                    Sold Tickets
                  </Label>
                  
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                    <div className="flex-1">
                      <Input
                        id="soldTickets"
                        type="number"
                        value={newSoldTickets}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 0;
                          setNewSoldTickets(Math.max(0, val));
                        }}
                        min={0}
                        max={!isUnlimited && newMaxTickets ? newMaxTickets : undefined}
                        className="bg-gray-800 border-gray-600 text-white text-xs sm:text-sm h-9 sm:h-10"
                        placeholder="Enter sold tickets"
                      />
                      {!isUnlimited && newMaxTickets && newSoldTickets > newMaxTickets && (
                        <p className="text-red-400 text-[10px] sm:text-xs mt-1 flex items-center gap-1">
                          <AlertCircle className="w-2.5 h-2.5 sm:w-3 sm:h-3 flex-shrink-0" />
                          Cannot exceed max tickets ({newMaxTickets.toLocaleString()})
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Quick Actions for Sold */}
                  <div className="mt-2">
                    <Label className="text-gray-400 mb-1.5 block text-[10px] sm:text-xs">Quick Adjust</Label>
                    <div className="flex gap-1.5 sm:gap-2 flex-wrap">
                      {quickSoldActions.map((action, idx) => (
                        <Button
                          key={idx}
                          variant="outline"
                          size="sm"
                          onClick={() => handleSoldQuickAction(action.value)}
                          disabled={
                            (action.value < 0 && newSoldTickets + action.value < 0) ||
                            (action.value > 0 && !isUnlimited && newMaxTickets && newSoldTickets + action.value > newMaxTickets)
                          }
                          className="border-gray-600 text-gray-300 hover:bg-gray-700 text-[10px] sm:text-xs px-2 sm:px-3 py-1 sm:py-1.5"
                        >
                          {action.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-2">
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
                    Save Changes
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

                {/* Info Box */}
                <div className="bg-blue-900/20 border border-blue-800 rounded-lg p-2.5 sm:p-3">
                  <div className="flex items-start gap-1.5 sm:gap-2">
                    <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                    <div className="text-[10px] sm:text-xs text-blue-300">
                      <p className="font-semibold mb-1">Important Notes:</p>
                      <ul className="list-disc list-inside space-y-0.5">
                        <li>Set <strong>Unlimited</strong> for no ticket cap</li>
                        <li>Edit <strong>Total Tickets</strong> to change capacity</li>
                        <li>Edit <strong>Sold Tickets</strong> for manual adjustments</li>
                        <li>Sold tickets cannot exceed total tickets</li>
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
            <AlertDialogDescription className="text-gray-400 text-xs sm:text-sm space-y-2">
              <p>Are you sure you want to make these changes?</p>
              
              <div className="bg-gray-800 rounded-lg p-3 space-y-2">
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-gray-400">Total Tickets:</span>
                  <span className="text-white font-semibold">
                    {isUnlimitedTickets ? (
                      <span className="text-green-400">Unlimited</span>
                    ) : (
                      currentMaxTickets.toLocaleString()
                    )}
                    {" → "}
                    {pendingMaxTickets === null || pendingMaxTickets === 0 ? (
                      <span className="text-green-400">Unlimited</span>
                    ) : (
                      <span className="text-yellow-500">{pendingMaxTickets.toLocaleString()}</span>
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-gray-400">Sold Tickets:</span>
                  <span className="text-white font-semibold">
                    {soldTickets.toLocaleString()}
                    {" → "}
                    <span className="text-yellow-500">{pendingSoldTickets.toLocaleString()}</span>
                  </span>
                </div>
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-gray-400">New Available:</span>
                  <span className="text-green-400 font-semibold">
                    {pendingMaxTickets === null || pendingMaxTickets === 0 ? (
                      <span>Unlimited</span>
                    ) : (
                      (pendingMaxTickets - pendingSoldTickets).toLocaleString()
                    )}
                  </span>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          
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