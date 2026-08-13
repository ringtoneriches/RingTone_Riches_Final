import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import AdminLayout from "@/components/admin/admin-layout";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Gift,
  Lock,
  Unlock,
  Ban,
  Plus,
  RefreshCw,
  Ticket,
  PoundSterling,
  ShieldAlert,
  Sparkles,
} from "lucide-react";

const statusStyles: Record<string, string> = {
  locked: "bg-slate-500/20 text-slate-300 border-slate-500/30",
  active: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  won: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  disabled: "bg-red-500/20 text-red-300 border-red-500/30",
};

export default function AdminInstantPool() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<{
    type: "activate" | "lock" | "disable";
    prize: any;
  } | null>(null);
  const [confirmHighValue, setConfirmHighValue] = useState(false);

  const [form, setForm] = useState({
    name: "",
    value: "",
    rewardType: "cash",
    rangeFrom: "1",
    rangeTo: "50",
    activationType: "manual",
    activationValue: "",
    allocationMethod: "b_on_activate",
  });

  const { data: competitions = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/instant-win/competitions"],
    queryFn: async () => {
      const res = await apiRequest("/api/admin/instant-win/competitions", "GET");
      return res.json();
    },
  });

  const { data, isLoading, refetch } = useQuery<any>({
    queryKey: ["/api/admin/competitions", selectedId, "instant-win", statusFilter],
    queryFn: async () => {
      const res = await apiRequest(
        `/api/admin/competitions/${selectedId}/instant-win?status=${statusFilter}`,
        "GET"
      );
      return res.json();
    },
    enabled: !!selectedId,
    refetchInterval: 8000,
  });

  const exposure = data?.exposure;
  const highValueThreshold = data?.highValueThreshold || 1000;
  const prizes = data?.prizes || [];

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return prizes;
    return prizes.filter((p: any) =>
      [p.name, p.status, p.activationType, String(p.winningTicketNumber || "")]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [prizes, search]);

  const modeMutation = useMutation({
    mutationFn: async (mode: string) => {
      const res = await apiRequest(
        `/api/admin/competitions/${selectedId}/instant-win-mode`,
        "PATCH",
        { mode }
      );
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Mode updated" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/instant-win/competitions"] });
      refetch();
    },
    onError: (error: any) => {
      toast({ title: "Could not update mode", description: error.message, variant: "destructive" });
    },
  });

  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await apiRequest(
        `/api/admin/competitions/${selectedId}/instant-win/prizes`,
        "POST",
        payload
      );
      if (!res.ok) {
        const body = await res.json();
        const err: any = new Error(body.message || "Failed to create prize");
        err.code = body.code;
        throw err;
      }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Prize created" });
      setCreateOpen(false);
      setConfirmHighValue(false);
      refetch();
    },
    onError: (error: any) => {
      toast({ title: "Could not create prize", description: error.message, variant: "destructive" });
    },
  });

  const actionMutation = useMutation({
    mutationFn: async ({ prizeId, type, confirm }: { prizeId: string; type: string; confirm?: boolean }) => {
      const res = await apiRequest(`/api/admin/instant-win/prizes/${prizeId}/${type}`, "POST", {
        confirmHighValue: confirm,
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.message || "Action failed");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Prize updated" });
      setConfirmOpen(false);
      setPendingAction(null);
      setConfirmHighValue(false);
      refetch();
    },
    onError: (error: any) => {
      toast({ title: "Action failed", description: error.message, variant: "destructive" });
    },
  });

  const selectedComp = competitions.find((c) => c.id === selectedId);
  const isControlled = selectedComp?.instantWinMode === "controlled_pool";

  const submitCreate = (forceHighValue = false) => {
    const value = Number(form.value);
    if (!form.name.trim() || !Number.isFinite(value)) {
      toast({ title: "Enter a prize name and value", variant: "destructive" });
      return;
    }
    if (value >= highValueThreshold && !forceHighValue) {
      setConfirmHighValue(true);
      return;
    }
    const activationValue =
      form.activationType === "datetime"
        ? { at: form.activationValue }
        : form.activationType === "manual"
        ? null
        : { value: Number(form.activationValue) };

    createMutation.mutate({
      name: form.name,
      value,
      rewardType: form.rewardType,
      rangeFrom: Number(form.rangeFrom),
      rangeTo: Number(form.rangeTo),
      activationType: form.activationType,
      activationValue,
      allocationMethod: form.allocationMethod,
      confirmHighValue: forceHighValue || value < highValueThreshold,
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-6 px-4 sm:px-0">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
              <Sparkles className="w-7 h-7 text-amber-400" />
              Instant Win Pool
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Finite tickets, RNG prize numbers, and frozen results. Unflagged games stay on probability.
            </p>
          </div>
        </div>

        <Card className="border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-transparent">
          <CardContent className="p-4 sm:p-6 grid gap-4 md:grid-cols-[1fr_auto_auto] items-end">
            <div>
              <Label className="mb-2 block">Competition</Label>
              <Select value={selectedId} onValueChange={setSelectedId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a game competition" />
                </SelectTrigger>
                <SelectContent>
                  {competitions.map((comp) => (
                    <SelectItem key={comp.id} value={comp.id}>
                      {comp.title} · {comp.type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedComp && (
              <>
                <div>
                  <Label className="mb-2 block">Ticket mode</Label>
                  <Select
                    value={selectedComp.instantWinMode || "probability"}
                    onValueChange={(mode) => modeMutation.mutate(mode)}
                  >
                    <SelectTrigger className="min-w-[200px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="probability">Probability (live default)</SelectItem>
                      <SelectItem value="controlled_pool">Controlled pool</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button variant="outline" onClick={() => refetch()}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {exposure && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <ExposureCard icon={Ticket} label="Tickets sold" value={`${exposure.soldTickets} / ${exposure.maxTickets || "∞"}`} hint={`${exposure.percentSold}% sold`} />
            <ExposureCard icon={PoundSterling} label="Revenue" value={`£${Number(exposure.revenue || 0).toFixed(2)}`} hint={`${exposure.remaining} remaining`} />
            <ExposureCard icon={Gift} label="Wins paid" value={`£${Number(exposure.instantWinsPaid || 0).toFixed(2)}`} hint={`${exposure.prizeCounts?.won || 0} won`} />
            <ExposureCard icon={ShieldAlert} label="Remaining liability" value={`£${Number(exposure.remainingLiability || 0).toFixed(2)}`} hint={`Active £${Number(exposure.activePrizeValue || 0).toFixed(2)} · Locked £${Number(exposure.lockedPrizeValue || 0).toFixed(2)}`} />
          </div>
        )}

        {selectedId && (
          <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <CardTitle>Prizes</CardTitle>
                <CardDescription>
                  Winning numbers stay hidden from customers while locked. Method B picks from unsold tickets on activate.
                </CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search prize, status, ticket"
                  className="w-48"
                />
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-36">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="locked">Locked</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="won">Won</SelectItem>
                    <SelectItem value="disabled">Disabled</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  onClick={() => setCreateOpen(true)}
                  disabled={!isControlled}
                  className="bg-amber-500 hover:bg-amber-600 text-black"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add prize
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {!isControlled && (
                <p className="text-sm text-muted-foreground mb-4">
                  Switch this competition to <span className="text-amber-400">Controlled pool</span> to configure instant-win prizes. Live probability games are unchanged until you do.
                </p>
              )}
              {isLoading ? (
                <div className="h-32 flex items-center justify-center text-muted-foreground">Loading prizes…</div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Prize</TableHead>
                        <TableHead>Winning ticket</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Activation</TableHead>
                        <TableHead>Last change</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.map((prize: any) => (
                        <TableRow key={prize.id}>
                          <TableCell>
                            <div className="font-medium">{prize.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {prize.rewardType} · £{Number(prize.value).toFixed(2)} · range {prize.rangeFrom}–{prize.rangeTo}
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {prize.status === "locked" ? "Hidden" : prize.winningTicketLabel}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={statusStyles[prize.status] || ""}>
                              {prize.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">
                            {prize.activationType.replace("_", " ")}
                            {prize.allocationMethod === "a_pregen" ? " · Method A" : " · Method B"}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {prize.lastChangedAt ? new Date(prize.lastChangedAt).toLocaleString("en-GB") : "—"}
                          </TableCell>
                          <TableCell className="text-right space-x-1">
                            {prize.status !== "won" && prize.status !== "active" && (
                              <Button size="sm" variant="outline" onClick={() => { setPendingAction({ type: "activate", prize }); setConfirmOpen(true); }}>
                                <Unlock className="w-3.5 h-3.5 mr-1" /> Activate
                              </Button>
                            )}
                            {prize.status === "active" && (
                              <Button size="sm" variant="outline" onClick={() => { setPendingAction({ type: "lock", prize }); setConfirmOpen(true); }}>
                                <Lock className="w-3.5 h-3.5 mr-1" /> Lock
                              </Button>
                            )}
                            {prize.status !== "won" && prize.status !== "disabled" && (
                              <Button size="sm" variant="ghost" onClick={() => { setPendingAction({ type: "disable", prize }); setConfirmOpen(true); }}>
                                <Ban className="w-3.5 h-3.5 mr-1" /> Disable
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                      {filtered.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-muted-foreground py-10">
                            No prizes yet.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Create instant-win prize</DialogTitle>
              <DialogDescription>
                The winning number is chosen by RNG from unsold tickets in the range. You never pick a customer.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-3">
              <div>
                <Label>Prize name</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="£100 Cash" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Value</Label>
                  <Input type="number" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} />
                </div>
                <div>
                  <Label>Type</Label>
                  <Select value={form.rewardType} onValueChange={(rewardType) => setForm({ ...form, rewardType })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="points">Points</SelectItem>
                      <SelectItem value="physical">Physical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Range from</Label>
                  <Input type="number" value={form.rangeFrom} onChange={(e) => setForm({ ...form, rangeFrom: e.target.value })} />
                </div>
                <div>
                  <Label>Range to</Label>
                  <Input type="number" value={form.rangeTo} onChange={(e) => setForm({ ...form, rangeTo: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Activation</Label>
                  <Select value={form.activationType} onValueChange={(activationType) => setForm({ ...form, activationType })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manual">Manual</SelectItem>
                      <SelectItem value="percent_sold">% sold</SelectItem>
                      <SelectItem value="count_sold">Count sold</SelectItem>
                      <SelectItem value="revenue">Revenue</SelectItem>
                      <SelectItem value="datetime">Date & time</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Method</Label>
                  <Select value={form.allocationMethod} onValueChange={(allocationMethod) => setForm({ ...form, allocationMethod })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="b_on_activate">Method B — pick on activate</SelectItem>
                      <SelectItem value="a_pregen">Method A — pick now, stay locked</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {form.activationType !== "manual" && (
                <div>
                  <Label>
                    {form.activationType === "datetime" ? "Activate at" : "Threshold"}
                  </Label>
                  <Input
                    type={form.activationType === "datetime" ? "datetime-local" : "number"}
                    value={form.activationValue}
                    onChange={(e) => setForm({ ...form, activationValue: e.target.value })}
                  />
                </div>
              )}
              {confirmHighValue && (
                <p className="text-sm text-amber-400">
                  This is a high-value prize (£{highValueThreshold}+). Confirm to create it.
                </p>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button className="bg-amber-500 hover:bg-amber-600 text-black" onClick={() => submitCreate(confirmHighValue)}>
                {confirmHighValue ? "Confirm high-value prize" : "Create locked prize"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="capitalize">{pendingAction?.type} prize</DialogTitle>
              <DialogDescription>
                {pendingAction?.type === "activate"
                  ? "Activation picks an unsold ticket number in the prize range. Sold loser tickets are never converted."
                  : "This updates prize status only. Sold ticket results cannot be rewritten."}
              </DialogDescription>
            </DialogHeader>
            {Number(pendingAction?.prize?.value || 0) >= highValueThreshold && pendingAction?.type === "activate" && (
              <p className="text-sm text-amber-400">High-value confirmation required for this prize.</p>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setConfirmOpen(false)}>Cancel</Button>
              <Button
                className="bg-amber-500 hover:bg-amber-600 text-black"
                onClick={() => {
                  if (!pendingAction) return;
                  actionMutation.mutate({
                    prizeId: pendingAction.prize.id,
                    type: pendingAction.type,
                    confirm: true,
                  });
                }}
              >
                Confirm
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}

function ExposureCard({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: any;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <Card className="border-amber-500/15 bg-card/80">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
          <Icon className="w-4 h-4 text-amber-400" />
          {label}
        </div>
        <div className="text-xl font-semibold">{value}</div>
        <div className="text-xs text-muted-foreground mt-1">{hint}</div>
      </CardContent>
    </Card>
  );
}
