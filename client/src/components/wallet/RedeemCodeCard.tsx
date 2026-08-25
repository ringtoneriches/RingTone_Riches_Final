import { FormEvent, useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, CheckCircle2, Gift, Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";

type RedeemSuccess = {
  success: boolean;
  message: string;
  amount: number;
  newBalance?: string | number | null;
  codeDetails?: {
    code: string;
    remainingUses: number | string;
    isSystemGenerated: boolean;
  };
};

type RedeemCodeCardProps = {
  variant?: "wallet" | "account";
};

function sanitizeCode(raw: string) {
  return raw.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 20);
}

function parseRedeemError(error: unknown) {
  const raw = error instanceof Error ? error.message : String(error);
  const jsonStart = raw.indexOf("{");
  if (jsonStart >= 0) {
    try {
      const parsed = JSON.parse(raw.slice(jsonStart));
      if (typeof parsed.error === "string" && parsed.error.trim()) {
        return parsed.error;
      }
      if (typeof parsed.message === "string" && parsed.message.trim()) {
        return parsed.message;
      }
    } catch {
      // Fall through to the default copy.
    }
  }
  return "Could not redeem this code. Please try again.";
}

function formatBalance(value: string | number | null | undefined) {
  const amount = typeof value === "number" ? value : parseFloat(value || "0");
  return Number.isFinite(amount) ? amount.toFixed(2) : "0.00";
}

export default function RedeemCodeCard({ variant = "wallet" }: RedeemCodeCardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [shake, setShake] = useState(false);
  const [success, setSuccess] = useState<RedeemSuccess | null>(null);
  const isWallet = variant === "wallet";

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.location.hash !== "#redeem-code") return;
    document.getElementById("redeem-code")?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }, []);

  const redeemMutation = useMutation({
    mutationFn: async (redeemCode: string) => {
      const response = await apiRequest("/api/redeem", "POST", { code: redeemCode });
      return (await response.json()) as RedeemSuccess;
    },
    onSuccess: (data) => {
      setSuccess(data);
      setCode("");
      setError("");
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/transactions"] });
      toast({
        title: "Code redeemed",
        description: data.message || `£${Number(data.amount).toFixed(2)} added to your wallet.`,
      });
    },
    onError: (err: unknown) => {
      const message = parseRedeemError(err);
      setError(message);
      setShake(true);
      window.setTimeout(() => setShake(false), 400);
    },
  });

  const canSubmit = code.length >= 3 && !redeemMutation.isPending;

  const handleSubmit = (event?: FormEvent) => {
    event?.preventDefault();
    const nextCode = sanitizeCode(code);
    if (nextCode.length < 3) {
      setError("Enter a valid code (at least 3 characters).");
      setShake(true);
      window.setTimeout(() => setShake(false), 400);
      return;
    }
    setError("");
    redeemMutation.mutate(nextCode);
  };

  const resetForm = () => {
    setSuccess(null);
    setError("");
    setCode("");
  };

  if (!isWallet) {
    return (
      <div className="bg-card rounded-xl border border-border p-6" id="redeem-code">
        <h3 className="text-xl font-bold mb-1">Redeem a Code</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Prize or flyer credit lands in your wallet instantly.
        </p>
        {success ? (
          <div className="text-center space-y-3" role="status">
            <CheckCircle2 className="mx-auto h-8 w-8 text-primary" />
            <p className="text-2xl font-bold text-primary">
              £{Number(success.amount).toFixed(2)} added
            </p>
            <p className="text-sm text-muted-foreground">
              New balance £{formatBalance(success.newBalance)}
            </p>
            <button
              type="button"
              onClick={resetForm}
              className="mt-1 text-sm text-primary hover:underline"
              data-testid="button-redeem-another"
            >
              Redeem another code
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <label htmlFor="account-redeem-code" className="sr-only">
              Redeem code
            </label>
            <input
              id="account-redeem-code"
              value={code}
              onChange={(e) => {
                setCode(sanitizeCode(e.target.value));
                if (error) setError("");
              }}
              maxLength={20}
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              placeholder="ENTER CODE"
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? "account-redeem-error" : undefined}
              className={`w-full rounded-lg border bg-background px-4 py-3 font-prize tracking-[0.18em] uppercase text-center focus:outline-none focus:ring-2 focus:ring-primary ${
                error ? "border-destructive" : "border-border"
              } ${shake ? "rr-redeem-shake" : ""}`}
              data-testid="input-redeem-code"
            />
            {error && (
              <p
                id="account-redeem-error"
                className="flex items-start gap-2 text-sm text-destructive"
                role="alert"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={!canSubmit}
              className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              data-testid="button-redeem-code"
            >
              {redeemMutation.isPending ? "Redeeming..." : "REDEEM"}
            </button>
          </form>
        )}
      </div>
    );
  }

  return (
    <Card
      id="redeem-code"
      className="rr-wallet-island scroll-mt-32 overflow-hidden bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800 border-yellow-500/30 shadow-xl shadow-yellow-500/10"
    >
      <CardHeader className="border-b border-yellow-500/20">
        <div className="flex items-center gap-2 text-yellow-400 justify-center sm:justify-start">
          <Gift className="h-6 w-6" />
          <span className="text-xl sm:text-2xl font-medium">Redeem a Code</span>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        {success ? (
          <div className="text-center space-y-4 py-2" role="status">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-yellow-500/40 bg-yellow-500/10">
              <CheckCircle2 className="h-8 w-8 text-yellow-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400 mb-1">Credit added</p>
              <p
                className="text-4xl font-bold bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent"
                data-testid="text-redeem-amount"
              >
                £{Number(success.amount).toFixed(2)}
              </p>
              <p className="mt-2 text-sm text-gray-400">
                New balance{" "}
                <span className="text-yellow-400 font-semibold">
                  £{formatBalance(success.newBalance)}
                </span>
              </p>
            </div>
            <button
              type="button"
              onClick={resetForm}
              className="text-sm text-yellow-400 hover:text-yellow-300 transition-colors"
              data-testid="button-redeem-another"
            >
              Redeem another code
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-sm text-gray-400 text-center sm:text-left">
              Enter a prize or flyer code. Credit is added to your wallet instantly.
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <label htmlFor="wallet-redeem-code" className="sr-only">
                Redeem code
              </label>
              <input
                id="wallet-redeem-code"
                value={code}
                onChange={(e) => {
                  setCode(sanitizeCode(e.target.value));
                  if (error) setError("");
                }}
                maxLength={20}
                autoComplete="off"
                autoCapitalize="characters"
                spellCheck={false}
                placeholder="ENTER CODE"
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? "wallet-redeem-error" : "wallet-redeem-hint"}
                className={`flex-1 w-full bg-black/50 border text-white px-4 py-3 rounded-lg font-prize tracking-[0.18em] uppercase text-center sm:text-left focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent placeholder:tracking-[0.18em] placeholder:text-gray-500 ${
                  error ? "border-red-500/70" : "border-yellow-500/30"
                } ${shake ? "rr-redeem-shake" : ""}`}
                data-testid="input-redeem-code"
              />
              <button
                type="submit"
                disabled={!canSubmit}
                className="rr-cta sm:min-w-[9.5rem] py-3 px-5 font-bold whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
                data-testid="button-redeem-code"
              >
                {redeemMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Redeeming
                  </>
                ) : (
                  "REDEEM"
                )}
              </button>
            </div>
            {error ? (
              <p
                id="wallet-redeem-error"
                className="flex items-start gap-2 text-sm text-red-400"
                role="alert"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                {error}
              </p>
            ) : (
              <p id="wallet-redeem-hint" className="text-xs text-gray-500">
                Flyer codes can be used once per account. Letters and numbers only.
              </p>
            )}
          </form>
        )}
      </CardContent>
    </Card>
  );
}
