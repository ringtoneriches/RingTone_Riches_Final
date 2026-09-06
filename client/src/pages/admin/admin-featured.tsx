import AdminLayout from "@/components/admin/admin-layout";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Competition } from "@shared/schema";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const SLOT_COUNT = 4;

export default function AdminFeatured() {
  const { toast } = useToast();
  const { data: competitions = [], isLoading } = useQuery<Competition[]>({
    queryKey: ["/api/admin/competitions"],
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, featuredOrder }: { id: string; featuredOrder: number | null }) => {
      const res = await apiRequest(`/api/admin/competitions/${id}/featured-order`, "PATCH", {
        featuredOrder,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/competitions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/competitions"] });
      toast({ title: "Featured slider updated" });
    },
    onError: () => {
      toast({ title: "Could not update featured order", variant: "destructive" });
    },
  });

  const active = competitions.filter((c) => c.isActive && c.status === "active");
  const featured = [...active]
    .filter((c) => Number(c.featuredOrder) > 0)
    .sort((a, b) => Number(a.featuredOrder) - Number(b.featuredOrder));

  const setSlot = (id: string, slot: number | null) => {
    updateMutation.mutate({ id, featuredOrder: slot });
  };

  return (
    <AdminLayout>
      <div className="space-y-6 p-4 sm:p-6">
        <div>
          <h1 className="text-2xl font-bold">Homepage featured slider</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Slides 1–{SLOT_COUNT} on the home page. Empty means not featured. Listing order is unchanged.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: SLOT_COUNT }, (_, i) => {
            const slot = i + 1;
            const current = featured.find((c) => Number(c.featuredOrder) === slot);
            return (
              <div key={slot} className="rounded-xl border bg-card p-4">
                <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <Star className="h-3.5 w-3.5" />
                  Slide {slot}
                </div>
                {current ? (
                  <>
                    <p className="line-clamp-2 text-sm font-semibold">{current.title}</p>
                    <p className="mt-1 text-xs uppercase text-muted-foreground">{current.type}</p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="mt-3"
                      onClick={() => setSlot(current.id, null)}
                      disabled={updateMutation.isPending}
                    >
                      Remove
                    </Button>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">Empty — next eligible game can fill this.</p>
                )}
              </div>
            );
          })}
        </div>

        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/40 text-left">
              <tr>
                <th className="px-4 py-3 font-semibold">Competition</th>
                <th className="px-4 py-3 font-semibold">Type</th>
                <th className="px-4 py-3 font-semibold">Featured slot</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td className="px-4 py-6 text-muted-foreground" colSpan={3}>
                    Loading…
                  </td>
                </tr>
              ) : (
                active.map((c) => (
                  <tr key={c.id} className="border-b last:border-0">
                    <td className="px-4 py-3 font-medium">{c.title}</td>
                    <td className="px-4 py-3 uppercase text-muted-foreground">{c.type}</td>
                    <td className="px-4 py-3">
                      <Input
                        type="number"
                        min={1}
                        max={SLOT_COUNT}
                        className="w-24"
                        defaultValue={Number(c.featuredOrder) > 0 ? Number(c.featuredOrder) : ""}
                        key={`${c.id}-${c.featuredOrder ?? "none"}`}
                        placeholder="—"
                        onBlur={(e) => {
                          const next = e.target.value.trim() === "" ? null : Number(e.target.value);
                          const current = Number(c.featuredOrder) > 0 ? Number(c.featuredOrder) : null;
                          if (next === current) return;
                          if (next !== null && (!Number.isInteger(next) || next < 1 || next > SLOT_COUNT)) {
                            toast({ title: `Use 1–${SLOT_COUNT}, or leave empty`, variant: "destructive" });
                            return;
                          }
                          setSlot(c.id, next);
                        }}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
