import { useMemo, useState } from "react";
import AdminLayout from "@/components/admin/admin-layout";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Ticket, Lock, Ban, Plus, Upload } from "lucide-react";
import { useRef } from "react";

const GAME_TYPES = ["spin", "scratch", "instant", "pop", "plinko", "voltz", "slot", "royal"];

type Campaign = {
  id: string;
  name: string;
  prizeType: "cash" | "credit" | "physical";
  prizeValue: string | null;
  prizeDescription: string | null;
  eligibleGameTypes: string[];
  includeFreePlays: boolean;
  minSpend: string | null;
  ticketCount: number;
  dropWindow: number;
  dropPositions: number[];
  playsSeen: number;
  ticketsAwarded: number;
  status: string;
  startsAt: string | null;
  endsAt: string | null;
  activatedAt: string | null;
};

type Win = {
  id: string;
  campaign: { id: string; name: string } | null;
  user: { firstName: string | null; lastName: string | null; email: string | null } | null;
  gameType: string;
  playId: string | null;
  originalResult: string | null;
  dropPosition: number;
  prizeType: string;
  prizeName: string;
  prizeValue: string | null;
  transactionId: string | null;
  fulfilmentStatus: string;
  awardedAt: string;
};

const STATUS_TONE: Record<string, string> = {
  draft: "bg-zinc-700 text-zinc-100",
  scheduled: "bg-blue-900 text-blue-100",
  active: "bg-emerald-800 text-emerald-100",
  completed: "bg-amber-800 text-amber-100",
  expired: "bg-zinc-800 text-zinc-400",
  cancelled: "bg-red-900 text-red-100",
};

const emptyForm = {
  name: "",
  prizeType: "cash" as Campaign["prizeType"],
  prizeValue: "",
  prizeDescription: "",
  prizeImageUrl: "",
  eligibleCompetitionIds: [] as string[],
  eligibleGameTypes: [] as string[],
  includeFreePlays: false,
  minSpend: "",
  ticketCount: "1",
  dropWindow: "5000",
  startsAt: "",
  endsAt: "",
};

export default function AdminGoldenTickets() {
  const { toast } = useToast();
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Only live competitions are worth targeting.
  const { data: competitions = [] } = useQuery<any[]>({ queryKey: ["/api/competitions"] });

  const { data: campaigns = [], isLoading } = useQuery<Campaign[]>({
    queryKey: ["/api/admin/golden-tickets"],
  });
  const { data: wins = [] } = useQuery<Win[]>({
    queryKey: ["/api/admin/golden-tickets/wins"],
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/admin/golden-tickets"] });
    queryClient.invalidateQueries({ queryKey: ["/api/admin/golden-tickets/wins"] });
  };

  const fail = (error: any) =>
    toast({
      title: "That didn't work",
      description: String(error?.message || error).replace(/^\d+:\s*/, ""),
      variant: "destructive",
    });

  const create = useMutation({
    mutationFn: () =>
      apiRequest("/api/admin/golden-tickets", "POST", {
        ...form,
        prizeValue: form.prizeValue || null,
        minSpend: form.minSpend || null,
        ticketCount: Number(form.ticketCount),
        dropWindow: Number(form.dropWindow),
        startsAt: form.startsAt || null,
        endsAt: form.endsAt || null,
      }),
    onSuccess: () => {
      toast({ title: "Campaign created", description: "It stays editable until you activate it." });
      setForm(emptyForm);
      setShowForm(false);
      refresh();
    },
    onError: fail,
  });

  const activate = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/admin/golden-tickets/${id}/activate`, "POST", {}),
    onSuccess: () => {
      toast({
        title: "Campaign is live",
        description: "The winning plays are sealed. It can't be edited now, only cancelled.",
      });
      refresh();
    },
    onError: fail,
  });

  const cancel = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/admin/golden-tickets/${id}/cancel`, "POST", {}),
    onSuccess: () => {
      toast({ title: "Campaign cancelled" });
      refresh();
    },
    onError: fail,
  });

  const setFulfilment = useMutation({
    mutationFn: ({ winId, status, note }: { winId: string; status: string; note?: string }) =>
      apiRequest(`/api/admin/golden-tickets/wins/${winId}/fulfilment`, "PATCH", { status, note }),
    onSuccess: () => {
      toast({ title: "Fulfilment updated" });
      refresh();
    },
    onError: fail,
  });

  const uploadImage = async (file: File) => {
    setUploading(true);
    try {
      const body = new FormData();
      body.append("image", file);
      const res = await fetch("/api/upload/competition-image", {
        method: "POST",
        credentials: "include",
        body,
      });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      setForm((f) => ({ ...f, prizeImageUrl: data.imagePath || data.url || "" }));
      toast({ title: "Image uploaded" });
    } catch (error) {
      fail(error);
    } finally {
      setUploading(false);
    }
  };

  const toggleCompetition = (id: string) =>
    setForm((f) => ({
      ...f,
      eligibleCompetitionIds: f.eligibleCompetitionIds.includes(id)
        ? f.eligibleCompetitionIds.filter((c) => c !== id)
        : [...f.eligibleCompetitionIds, id],
    }));

  const toggleGame = (game: string) =>
    setForm((f) => ({
      ...f,
      eligibleGameTypes: f.eligibleGameTypes.includes(game)
        ? f.eligibleGameTypes.filter((g) => g !== game)
        : [...f.eligibleGameTypes, game],
    }));

  const windowWarning = useMemo(() => {
    const tickets = Number(form.ticketCount);
    const window = Number(form.dropWindow);
    if (!tickets || !window) return null;
    if (tickets > window) return "The drop window has to be at least as large as the ticket count.";
    return null;
  }, [form.ticketCount, form.dropWindow]);

  return (
    <AdminLayout>
      <div className="space-y-6 p-4 sm:p-6">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold">
              <Ticket className="h-6 w-6 text-yellow-400" />
              Golden Tickets
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-gray-400">
              A prize layer that sits above the games. A play gets its normal result first, then a
              Golden Ticket may drop on top of it. The winning plays are chosen when you activate a
              campaign and sealed from then on, so nobody can pick a winner afterwards.
            </p>
          </div>
          <Button onClick={() => setShowForm((s) => !s)} data-testid="button-new-campaign">
            <Plus className="mr-2 h-4 w-4" />
            {showForm ? "Close" : "New campaign"}
          </Button>
        </header>

        {showForm && (
          <Card className="space-y-4 p-4 sm:p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label htmlFor="gt-name">Campaign name</Label>
                <Input
                  id="gt-name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. £500 Golden Ticket"
                  data-testid="input-campaign-name"
                />
                <p className="mt-1 text-xs text-gray-500">
                  The winner sees this name on the reveal.
                </p>
              </div>

              <div>
                <Label>Prize type</Label>
                <Select
                  value={form.prizeType}
                  onValueChange={(v) => setForm({ ...form, prizeType: v as Campaign["prizeType"] })}
                >
                  <SelectTrigger data-testid="select-prize-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash — credited automatically</SelectItem>
                    <SelectItem value="credit">Site credit — credited automatically</SelectItem>
                    <SelectItem value="physical">Physical prize — you fulfil it</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="gt-value">
                  Prize value {form.prizeType === "physical" ? "(for reporting)" : "(£)"}
                </Label>
                <Input
                  id="gt-value"
                  inputMode="decimal"
                  value={form.prizeValue}
                  onChange={(e) => setForm({ ...form, prizeValue: e.target.value })}
                  placeholder="500.00"
                  data-testid="input-prize-value"
                />
              </div>

              <div className="sm:col-span-2">
                <Label htmlFor="gt-desc">Description</Label>
                <Textarea
                  id="gt-desc"
                  value={form.prizeDescription}
                  onChange={(e) => setForm({ ...form, prizeDescription: e.target.value })}
                  placeholder="Shown on the reveal, e.g. 55-inch 4K TV delivered to your door"
                />
              </div>

              <div className="sm:col-span-2">
                <Label>Prize image</Label>
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) uploadImage(file);
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading}
                    data-testid="button-upload-prize-image"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    {uploading ? "Uploading…" : "Upload image"}
                  </Button>
                  {form.prizeImageUrl && (
                    <>
                      <img
                        src={form.prizeImageUrl}
                        alt=""
                        className="h-14 w-14 rounded-lg border border-zinc-700 object-cover"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        className="text-xs text-red-400"
                        onClick={() => setForm({ ...form, prizeImageUrl: "" })}
                      >
                        Remove
                      </Button>
                    </>
                  )}
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Shown on the winner's reveal. Optional.
                </p>
              </div>

              <div className="sm:col-span-2">
                <Label>Limit to specific competitions (optional)</Label>
                <div className="mt-2 flex max-h-40 flex-wrap gap-2 overflow-y-auto">
                  {competitions.length === 0 ? (
                    <p className="text-xs text-gray-500">No competitions loaded.</p>
                  ) : (
                    competitions.map((comp: any) => {
                      const on = form.eligibleCompetitionIds.includes(comp.id);
                      return (
                        <button
                          key={comp.id}
                          type="button"
                          onClick={() => toggleCompetition(comp.id)}
                          className={`max-w-full truncate rounded-lg border px-2.5 py-1 text-xs transition-colors ${
                            on
                              ? "border-yellow-400 bg-yellow-400/15 text-yellow-300"
                              : "border-zinc-700 text-gray-400 hover:border-zinc-500"
                          }`}
                          data-testid={`chip-comp-${comp.id}`}
                        >
                          {comp.title}
                        </button>
                      );
                    })
                  )}
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Select none to include every competition of the chosen games.
                </p>
              </div>

              <div className="sm:col-span-2">
                <Label>Eligible games</Label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {GAME_TYPES.map((game) => {
                    const on = form.eligibleGameTypes.includes(game);
                    return (
                      <button
                        key={game}
                        type="button"
                        onClick={() => toggleGame(game)}
                        className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide transition-colors ${
                          on
                            ? "border-yellow-400 bg-yellow-400/15 text-yellow-300"
                            : "border-zinc-700 text-gray-400 hover:border-zinc-500"
                        }`}
                        data-testid={`chip-game-${game}`}
                      >
                        {game}
                      </button>
                    );
                  })}
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Select none to include every game.
                </p>
              </div>

              <div>
                <Label htmlFor="gt-tickets">How many tickets</Label>
                <Input
                  id="gt-tickets"
                  inputMode="numeric"
                  value={form.ticketCount}
                  onChange={(e) => setForm({ ...form, ticketCount: e.target.value })}
                  data-testid="input-ticket-count"
                />
              </div>

              <div>
                <Label htmlFor="gt-window">Spread across the next … plays</Label>
                <Input
                  id="gt-window"
                  inputMode="numeric"
                  value={form.dropWindow}
                  onChange={(e) => setForm({ ...form, dropWindow: e.target.value })}
                  data-testid="input-drop-window"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Tickets are placed randomly inside this many eligible plays. Set it too high for
                  your traffic and they may never be reached before the end date.
                </p>
              </div>

              <div>
                <Label htmlFor="gt-minspend">Minimum spend per play (optional)</Label>
                <Input
                  id="gt-minspend"
                  inputMode="decimal"
                  value={form.minSpend}
                  onChange={(e) => setForm({ ...form, minSpend: e.target.value })}
                  placeholder="0.00"
                />
              </div>

              <div className="flex items-end">
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.includeFreePlays}
                    onChange={(e) => setForm({ ...form, includeFreePlays: e.target.checked })}
                    className="h-4 w-4 accent-yellow-400"
                    data-testid="checkbox-free-plays"
                  />
                  Include free plays (e.g. the daily spin)
                </label>
              </div>

              <div>
                <Label htmlFor="gt-start">Starts (optional)</Label>
                <Input
                  id="gt-start"
                  type="datetime-local"
                  value={form.startsAt}
                  onChange={(e) => setForm({ ...form, startsAt: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="gt-end">Ends (optional)</Label>
                <Input
                  id="gt-end"
                  type="datetime-local"
                  value={form.endsAt}
                  onChange={(e) => setForm({ ...form, endsAt: e.target.value })}
                />
                <p className="mt-1 text-xs text-gray-500">
                  Tickets not reached by this date expire unawarded.
                </p>
              </div>
            </div>

            {windowWarning && <p className="text-sm text-red-400">{windowWarning}</p>}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => create.mutate()}
                disabled={create.isPending || !form.name || Boolean(windowWarning)}
                data-testid="button-create-campaign"
              >
                {create.isPending ? "Creating…" : "Create campaign"}
              </Button>
            </div>
          </Card>
        )}

        <Card className="p-0">
          <div className="border-b border-zinc-800 px-4 py-3 sm:px-6">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-400">
              Campaigns
            </h2>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Prize</TableHead>
                  <TableHead>Games</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-8 text-center text-gray-500">
                      Loading…
                    </TableCell>
                  </TableRow>
                ) : campaigns.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-8 text-center text-gray-500">
                      No campaigns yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  campaigns.map((c) => (
                    <TableRow key={c.id} data-testid={`row-campaign-${c.id}`}>
                      <TableCell className="font-medium">{c.name}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        {c.prizeValue ? `£${Number(c.prizeValue).toLocaleString("en-GB")}` : "—"}
                        <span className="ml-1 text-xs text-gray-500">{c.prizeType}</span>
                      </TableCell>
                      <TableCell className="text-xs text-gray-400">
                        {c.eligibleGameTypes.length ? c.eligibleGameTypes.join(", ") : "all games"}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-xs text-gray-400">
                        {c.status === "draft" || c.status === "scheduled" ? (
                          <>
                            {c.ticketCount} ticket{c.ticketCount === 1 ? "" : "s"} / {c.dropWindow}{" "}
                            plays
                          </>
                        ) : (
                          <>
                            {c.ticketsAwarded}/{c.ticketCount} awarded
                            <br />
                            {c.playsSeen}/{c.dropWindow} plays
                          </>
                        )}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wide ${
                            STATUS_TONE[c.status] || "bg-zinc-800 text-gray-300"
                          }`}
                        >
                          {c.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        {(c.status === "draft" || c.status === "scheduled") && (
                          <Button
                            size="sm"
                            className="mr-2"
                            onClick={() => activate.mutate(c.id)}
                            disabled={activate.isPending}
                            data-testid={`button-activate-${c.id}`}
                          >
                            <Lock className="mr-1 h-3 w-3" />
                            Activate
                          </Button>
                        )}
                        {["draft", "scheduled", "active"].includes(c.status) && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => cancel.mutate(c.id)}
                            disabled={cancel.isPending}
                            data-testid={`button-cancel-${c.id}`}
                          >
                            <Ban className="mr-1 h-3 w-3" />
                            Cancel
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>

        <Card className="p-0">
          <div className="border-b border-zinc-800 px-4 py-3 sm:px-6">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-400">
              Golden Ticket history
            </h2>
            <p className="mt-1 text-xs text-gray-500">
              Every drop, with the play it landed on and what that play itself returned.
            </p>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Winner</TableHead>
                  <TableHead>Campaign</TableHead>
                  <TableHead>Game</TableHead>
                  <TableHead>Play</TableHead>
                  <TableHead>Game result</TableHead>
                  <TableHead>Prize</TableHead>
                  <TableHead>Fulfilment</TableHead>
                  <TableHead>When</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {wins.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="py-8 text-center text-gray-500">
                      No Golden Tickets have dropped yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  wins.map((w) => (
                    <TableRow key={w.id} data-testid={`row-win-${w.id}`}>
                      <TableCell>
                        <div className="font-medium">
                          {[w.user?.firstName, w.user?.lastName].filter(Boolean).join(" ") || "—"}
                        </div>
                        <div className="text-xs text-gray-500">{w.user?.email}</div>
                      </TableCell>
                      <TableCell className="text-xs">{w.campaign?.name}</TableCell>
                      <TableCell className="text-xs uppercase">{w.gameType}</TableCell>
                      <TableCell className="text-xs text-gray-400">
                        <div>{w.playId || "—"}</div>
                        <div className="text-gray-600">position {w.dropPosition}</div>
                      </TableCell>
                      <TableCell className="text-xs text-gray-400">
                        {w.originalResult || "—"}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-xs">
                        {w.prizeValue ? `£${Number(w.prizeValue).toLocaleString("en-GB")}` : "—"}
                        <span className="ml-1 text-gray-500">{w.prizeType}</span>
                        {w.transactionId && (
                          <div className="text-[10px] text-gray-600">
                            txn {w.transactionId.slice(0, 8)}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-xs">
                        {/* Cash and site credit are already paid, so there is
                            nothing to chase. Physical prizes need a human. */}
                        {w.fulfilmentStatus === "auto_credited" ? (
                          <span className="text-emerald-400">credited</span>
                        ) : w.fulfilmentStatus === "awaiting_fulfilment" ? (
                          <div className="flex flex-col items-start gap-1">
                            <span className="text-amber-400">awaiting fulfilment</span>
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-6 px-2 text-[10px]"
                                onClick={() =>
                                  setFulfilment.mutate({ winId: w.id, status: "fulfilled" })
                                }
                                disabled={setFulfilment.isPending}
                                data-testid={`button-fulfil-${w.id}`}
                              >
                                Mark sent
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 px-2 text-[10px] text-red-400"
                                onClick={() =>
                                  setFulfilment.mutate({ winId: w.id, status: "cancelled" })
                                }
                                disabled={setFulfilment.isPending}
                                data-testid={`button-void-${w.id}`}
                              >
                                Void
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <span className={w.fulfilmentStatus === "fulfilled" ? "text-emerald-400" : "text-gray-500"}>
                            {w.fulfilmentStatus.replace(/_/g, " ")}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-xs text-gray-400">
                        {new Date(w.awardedAt).toLocaleString("en-GB")}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>
    </AdminLayout>
  );
}
