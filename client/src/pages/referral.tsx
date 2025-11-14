import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";
import { Copy, Users, DollarSign, Gift } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface ReferralStats {
  totalReferrals: number;
  totalEarned: string;
  referrals: Array<{
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    createdAt: Date;
  }>;
}

export default function Referral() {
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: referralCodeData, isLoading: isLoadingCode } = useQuery<{ referralCode: string }>({
    queryKey: ["/api/user/referral-code"],
    enabled: !!user,
  });

  const { data: stats, isLoading: isLoadingStats } = useQuery<ReferralStats>({
    queryKey: ["/api/user/referral-stats"],
    enabled: !!user,
  });

  const referralLink = referralCodeData?.referralCode
    ? `${window.location.origin}/register?ref=${referralCodeData.referralCode}`
    : "";

  const copyReferralLink = () => {
    if (referralLink) {
      navigator.clipboard.writeText(referralLink);
      toast({
        title: "Copied!",
        description: "Referral link copied to clipboard",
      });
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Please Log In</CardTitle>
            <CardDescription>You need to be logged in to view your referral information</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const isLoading = isLoadingCode || isLoadingStats;

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-zinc-900 to-black">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-400 bg-clip-text text-transparent">
            Referral Scheme
          </h1>
          <p className="text-muted-foreground">Share the love and earn rewards!</p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          <Link href="/wallet" className="text-muted-foreground hover:text-primary transition-colors whitespace-nowrap" data-testid="link-wallet">
            Wallet
          </Link>
          <span className="text-muted-foreground">•</span>
          <Link href="/orders" className="text-muted-foreground hover:text-primary transition-colors whitespace-nowrap" data-testid="link-orders">
            Orders
          </Link>
          <span className="text-muted-foreground">•</span>
          <Link href="/ringtune-points" className="text-muted-foreground hover:text-primary transition-colors whitespace-nowrap" data-testid="link-ringtune-points">
            Ringtune Points
          </Link>
          <span className="text-muted-foreground">•</span>
          <Link href="/entries" className="text-muted-foreground hover:text-primary transition-colors whitespace-nowrap" data-testid="link-entries">
            Entries
          </Link>
          <span className="text-muted-foreground">•</span>
          <span className="text-primary font-medium whitespace-nowrap">Referral Scheme</span>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Card className="bg-zinc-900/50 border-yellow-500/20 hover:border-yellow-500/40 transition-all">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="h-5 w-5 text-yellow-500" />
                Total Referrals
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-10 bg-muted animate-pulse rounded" />
              ) : (
                <p className="text-3xl font-bold text-yellow-500" data-testid="text-total-referrals">
                  {stats?.totalReferrals || 0}
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="bg-zinc-900/50 border-yellow-500/20 hover:border-yellow-500/40 transition-all">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <DollarSign className="h-5 w-5 text-green-500" />
                Total Earned
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-10 bg-muted animate-pulse rounded" />
              ) : (
                <p className="text-3xl font-bold text-green-500" data-testid="text-total-earned">
                  £{stats?.totalEarned || "0.00"}
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Referral Link Card */}
        <Card className="mb-6 bg-gradient-to-br from-yellow-500/10 via-yellow-500/5 to-transparent border-yellow-500/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-yellow-500" />
              Your Referral Link
            </CardTitle>
            <CardDescription>Share this link with friends to earn rewards</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoadingCode ? (
              <div className="h-12 bg-muted animate-pulse rounded" />
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={referralLink}
                  readOnly
                  className="flex-1 px-4 py-3 bg-black/50 border border-yellow-500/30 rounded-lg text-sm font-mono"
                  data-testid="input-referral-link"
                />
                <Button
                  onClick={copyReferralLink}
                  className="bg-yellow-500 hover:bg-yellow-600 text-black"
                  data-testid="button-copy"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </Button>
              </div>
            )}

            <div className="bg-black/30 rounded-lg p-4 space-y-2">
              <h3 className="font-semibold text-yellow-500">How it works:</h3>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Share your unique referral link with friends</li>
                <li>• They sign up using your link and make their first entry</li>
                <li>• You earn £5 bonus credit when they complete their first competition entry</li>
                <li>• Your friend gets 100 Ringtone Points as a welcome bonus</li>
                <li>• Unlimited referrals - the more friends, the more you earn!</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Referred Friends */}
        <Card className="bg-zinc-900/50 border-yellow-500/20">
          <CardHeader>
            <CardTitle>Your Referrals</CardTitle>
            <CardDescription>
              {stats?.totalReferrals === 0
                ? "You haven't referred anyone yet"
                : `${stats?.totalReferrals} friend${stats?.totalReferrals === 1 ? "" : "s"} joined through your link`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 bg-muted animate-pulse rounded" />
                ))}
              </div>
            ) : stats?.referrals && stats.referrals.length > 0 ? (
              <div className="space-y-2">
                {stats.referrals.map((referral) => (
                  <div
                    key={referral.id}
                    className="flex items-center justify-between p-4 bg-black/30 rounded-lg border border-yellow-500/10 hover:border-yellow-500/30 transition-colors"
                    data-testid={`referral-${referral.id}`}
                  >
                    <div>
                      <p className="font-medium">
                        {referral.firstName} {referral.lastName}
                      </p>
                      <p className="text-sm text-muted-foreground">{referral.email}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">
                        Joined {format(new Date(referral.createdAt), "dd MMM yyyy")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground mb-4">No referrals yet</p>
                <p className="text-sm text-muted-foreground">
                  Start sharing your link to earn rewards!
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
