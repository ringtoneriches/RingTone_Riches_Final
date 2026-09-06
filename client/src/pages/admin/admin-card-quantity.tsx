import AdminLayout from "@/components/admin/admin-layout";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Hash } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Competition } from "@shared/schema";
import { Input } from "@/components/ui/input";
import { getCompetitionTypeConfig } from "@/lib/competition-display";

export default function AdminCardQuantity() {
  const { toast } = useToast();
  const { data: competitions = [], isLoading } = useQuery<Competition[]>({
    queryKey: ["/api/admin/competitions"],
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, defaultQuantity }: { id: string; defaultQuantity: number }) => {
      const res = await apiRequest(`/api/admin/competitions/${id}/default-quantity`, "PATCH", {
        defaultQuantity,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/competitions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/competitions"] });
      toast({ title: "Card quantity updated" });
    },
    onError: () => {
      toast({ title: "Could not update quantity", variant: "destructive" });
    },
  });

  const active = competitions
    .filter((c) => c.isActive && c.status === "active")
    .sort((a, b) => (a.displayOrder ?? 999) - (b.displayOrder ?? 999));

  const save = (id: string, current: number, nextRaw: string) => {
    const next = Math.floor(Number(nextRaw));
    if (!Number.isInteger(next) || next < 1 || next > 500) {
      toast({ title: "Use a whole number from 1 to 500", variant: "destructive" });
      return;
    }
    if (next === current) return;
    updateMutation.mutate({ id, defaultQuantity: next });
  };

  return (
    <AdminLayout>
      <div className="space-y-6 p-4 sm:p-6">
        <div>
          <h1 className="text-2xl font-bold">Card quantity</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            This is the number shown on each homepage card when a customer lands. They can still change it
            before Add to cart or ENTER NOW. Does not change ticket price or checkout.
          </p>
        </div>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading competitions…</p>
        ) : (
          <div className="overflow-hidden rounded-xl border bg-card">
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-semibold">Game</th>
                  <th className="px-4 py-3 font-semibold">Type</th>
                  <th className="px-4 py-3 font-semibold">Default qty</th>
                </tr>
              </thead>
              <tbody>
                {active.map((competition) => {
                  const typeCfg = getCompetitionTypeConfig(competition.type);
                  const current = Math.max(1, Number(competition.defaultQuantity) || 1);
                  return (
                    <tr key={competition.id} className="border-b last:border-0">
                      <td className="px-4 py-3">
                        <p className="line-clamp-2 font-medium">{competition.title}</p>
                      </td>
                      <td className="px-4 py-3 text-xs uppercase text-muted-foreground">
                        {typeCfg.label}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Hash className="h-3.5 w-3.5 text-muted-foreground" />
                          <Input
                            type="number"
                            min={1}
                            max={500}
                            defaultValue={current}
                            className="h-9 w-24"
                            data-testid={`input-default-qty-${competition.id}`}
                            onBlur={(e) => save(competition.id, current, e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key !== "Enter") return;
                              save(competition.id, current, (e.target as HTMLInputElement).value);
                            }}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {active.length === 0 && (
              <p className="px-4 py-8 text-center text-sm text-muted-foreground">
                No live competitions.
              </p>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
