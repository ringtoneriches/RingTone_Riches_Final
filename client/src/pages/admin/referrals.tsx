import { useState } from "react";
import AdminLayout from "@/components/admin/admin-layout";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Users, Trophy, ShieldAlert, Check, Ban, Download } from "lucide-react";

type Row = {
  id: string;
  status: string;
  referral_code: string | null;
  registered_at: string;
  signup_points_awarded: number;
  first_top_up_at: string | null;
  first_top_up_amount: string | null;
  reward_points: number;
  rewarded_at: string | null;
  risk_reason: string | null;
  risk_signals: string[] | null;
  referrer_email: string;
  referrer_first: string | null;
  referrer_last: string | null;
  referrer_code: string | null;
  referred_email: string;
  referred_first: string | null;
  referred_last: string | null;
};

type Totals = {
  total: number; pending: number; successful: number;
  flagged: number; blocked: number; reward_points: number; signup_points: number;
};

const TABS = [
  { id: "", label: "All" },
  { id: "pending", label: "Awaiting top-up" },
  { id: "rewarded", label: "Paid" },
  { id: "flagged", label: "Needs review" },
  { id: "blocked", label: "Blocked" },
];

const STATUS_TONE: Record<string, string> = {
  pending: "bg-amber-900/40 text-amber-200",
  rewarded: "bg-emerald-900/40 text-emerald-200",
  flagged: "bg-orange-900/50 text-orange-200",
  blocked: "bg-red-900/40 text-red-200",
};

const name = (first?: string | null, last?: string | null) =>
  [first, last].filter(Boolean).join(" ") || "—";

const date = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—";

export default function AdminReferrals() {
  const { toast } = useToast();
  const [tab, setTab] = useState("");

  const { data, isLoading } = useQuery<{ referrals: Row[]; totals: Totals }>({
    queryKey: ["/api/admin/referrals", tab],
    queryFn: async () => {
      const res = await fetch(`/api/admin/referrals${tab ? `?status=${tab}` : ""}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to load referrals");
      return res.json();
    },
  });

  const { data: board } = useQuery<{ weekStart: string; leaderboard: Array<{ name: string; referrals: number }> }>({
    queryKey: ["/api/admin/referrals/leaderboard"],
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["/api/admin/referrals"] });

  const review = useMutation({
    mutationFn: ({ id, decision }: { id: string; decision: "approve" | "block" }) =>
      apiRequest(`/api/admin/referrals/${id}/review`, "PATCH", { decision }),
    onSuccess: () => {
      toast({ title: "Referral updated" });
      refresh();
    },
    onError: (e: any) =>
      toast({ title: "That didn't work", description: String(e?.message), variant: "destructive" }),
  });

  const exportCsv = () => {
    const rows = data?.referrals ?? [];
    if (!rows.length) return;
    const head = [
      "Referrer", "Referrer email", "Code", "Referred member", "Referred email",
      "Registered", "Signup points", "Topped up", "First top-up", "Reward points",
      "Rewarded at", "Status", "Risk",
    ];
    const csv = [
      head.join(","),
      ...rows.map((r) =>
        [
          name(r.referrer_first, r.referrer_last), r.referrer_email, r.referrer_code ?? "",
          name(r.referred_first, r.referred_last), r.referred_email,
          date(r.registered_at), r.signup_points_awarded,
          r.first_top_up_at ? "yes" : "no",
          r.first_top_up_amount ? `£${r.first_top_up_amount}` : "",
          r.reward_points, date(r.rewarded_at), r.status, r.risk_reason ?? "",
        ]
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(","),
      ),
    ].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `referrals-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const totals = data?.totals;

  return (
    <AdminLayout>
      <div className="space-y-6 p-4 sm:p-6">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold">
              <Users className="h-6 w-6 text-yellow-400" />
              Referrals
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-gray-400">
              A referral only counts once the new member actually tops up. Anything that
              looks like the same person twice is blocked outright; anything merely
              suspicious is paid and listed under <strong>Needs review</strong>.
            </p>
          </div>
          <Button variant="outline" onClick={exportCsv} disabled={!data?.referrals.length}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </header>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {[
            { label: "Total", value: totals?.total ?? 0 },
            { label: "Awaiting top-up", value: totals?.pending ?? 0 },
            { label: "Successful", value: totals?.successful ?? 0 },
            { label: "Needs review", value: totals?.flagged ?? 0, warn: true },
            { label: "Blocked", value: totals?.blocked ?? 0 },
            {
              label: "Points paid",
              value: (totals?.reward_points ?? 0) + (totals?.signup_points ?? 0),
              sub: `£${(((totals?.reward_points ?? 0) + (totals?.signup_points ?? 0)) / 100).toFixed(2)}`,
            },
          ].map((s) => (
            <Card key={s.label} className="p-3">
              <div className="text-[10px] font-bold uppercase tracking-wide text-gray-500">
                {s.label}
              </div>
              <div className={`mt-1 text-2xl font-bold ${s.warn && s.value ? "text-orange-400" : ""}`}>
                {s.value}
              </div>
              {s.sub && <div className="text-xs text-yellow-500">{s.sub}</div>}
            </Card>
          ))}
        </div>

        <Card className="p-4">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Trophy className="h-4 w-4 text-yellow-400" />
            Top recruiters — week of {board?.weekStart ?? "—"}
          </div>
          {board?.leaderboard.length ? (
            <ol className="mt-3 space-y-1">
              {board.leaderboard.slice(0, 5).map((row, i) => (
                <li key={i} className="flex justify-between text-sm">
                  <span className="text-gray-300">
                    <span className="mr-2 text-yellow-500">{i + 1}</span>
                    {row.name}
                  </span>
                  <span className="font-semibold">{row.referrals}</span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="mt-2 text-sm text-gray-500">No qualifying referrals yet this week.</p>
          )}
        </Card>

        <div className="flex flex-wrap gap-2">
          {TABS.map((t) => (
            <button
              key={t.id || "all"}
              onClick={() => setTab(t.id)}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                tab === t.id
                  ? "border-yellow-400 bg-yellow-400/15 text-yellow-300"
                  : "border-zinc-700 text-gray-400 hover:border-zinc-500"
              }`}
              data-testid={`tab-${t.id || "all"}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <Card className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Referrer</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Referred member</TableHead>
                  <TableHead>Registered</TableHead>
                  <TableHead>First top-up</TableHead>
                  <TableHead>Reward</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Review</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="py-8 text-center text-gray-500">Loading…</TableCell>
                  </TableRow>
                ) : !data?.referrals.length ? (
                  <TableRow>
                    <TableCell colSpan={8} className="py-8 text-center text-gray-500">
                      Nothing here.
                    </TableCell>
                  </TableRow>
                ) : (
                  data.referrals.map((r) => (
                    <TableRow key={r.id} data-testid={`referral-${r.id}`}>
                      <TableCell>
                        <div className="font-medium">{name(r.referrer_first, r.referrer_last)}</div>
                        <div className="text-xs text-gray-500">{r.referrer_email}</div>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{r.referrer_code ?? "—"}</TableCell>
                      <TableCell>
                        <div className="font-medium">{name(r.referred_first, r.referred_last)}</div>
                        <div className="text-xs text-gray-500">{r.referred_email}</div>
                        <div className="text-[10px] text-gray-600">
                          +{r.signup_points_awarded} pts on signup
                        </div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-xs">{date(r.registered_at)}</TableCell>
                      <TableCell className="whitespace-nowrap text-xs">
                        {r.first_top_up_at ? (
                          <>
                            <div className="font-semibold text-emerald-400">£{r.first_top_up_amount}</div>
                            <div className="text-gray-500">{date(r.first_top_up_at)}</div>
                          </>
                        ) : (
                          <span className="text-gray-600">Not yet</span>
                        )}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-xs">
                        {r.reward_points ? (
                          <>
                            <div className="font-semibold">{r.reward_points} pts</div>
                            <div className="text-gray-500">{date(r.rewarded_at)}</div>
                          </>
                        ) : (
                          <span className="text-gray-600">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase ${STATUS_TONE[r.status] ?? "bg-zinc-800 text-gray-300"}`}>
                          {r.status}
                        </span>
                        {r.risk_reason && (
                          <div className="mt-1 flex items-start gap-1 text-[10px] text-orange-300/80">
                            <ShieldAlert className="mt-0.5 h-3 w-3 shrink-0" />
                            <span>{r.risk_reason}</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {r.status === "flagged" && (
                          <div className="flex justify-end gap-1">
                            <Button
                              size="sm" variant="outline" className="h-7 px-2 text-[10px]"
                              onClick={() => review.mutate({ id: r.id, decision: "approve" })}
                              disabled={review.isPending}
                              data-testid={`button-approve-${r.id}`}
                            >
                              <Check className="mr-1 h-3 w-3" />
                              Genuine
                            </Button>
                            <Button
                              size="sm" variant="ghost" className="h-7 px-2 text-[10px] text-red-400"
                              onClick={() => review.mutate({ id: r.id, decision: "block" })}
                              disabled={review.isPending}
                              data-testid={`button-block-${r.id}`}
                            >
                              <Ban className="mr-1 h-3 w-3" />
                              Abuse
                            </Button>
                          </div>
                        )}
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
