import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import Header from "@/components/layout/header";
import { Link } from "wouter";
import { format } from "date-fns";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User } from "@shared/schema";

interface Transaction {
  id: string;
  type: string;
  amount: string;
  description: string;
  orderId: string | null;
  createdAt: string;
}

export default function RingtonePoints() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: userData } = useQuery<User>({
    queryKey: ["/api/auth/user"],
    enabled: !!user,
  });

  // Fetch all transactions
  const { data: allTransactions = [], isLoading: isLoadingTransactions } = useQuery<Transaction[]>({
    queryKey: ["/api/user/transactions"],
    enabled: !!user,
  });

  // Filter transactions that involve ringtone points and sort by date (newest first)
  const pointsTransactions = allTransactions
    .filter((t) => 
      t.description?.toLowerCase().includes("ringtone") || 
      t.description?.toLowerCase().includes("points")
    )
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const ringtonePoints = userData?.ringtonePoints || 0;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        {/* Navigation Tabs - Mobile Optimized */}
        <div className="bg-muted text-center py-3 sm:py-4 mb-4 sm:mb-8 rounded-lg">
          <div className="flex flex-wrap justify-center gap-2 sm:gap-4 text-xs sm:text-sm px-2">
            <Link href="/orders" className="text-muted-foreground hover:text-primary transition-colors px-2 py-1" data-testid="link-orders">
              Orders
            </Link>
            <Link href="/entries" className="text-muted-foreground hover:text-primary transition-colors px-2 py-1" data-testid="link-entries">
              Entries
            </Link>
            <span className="text-primary font-semibold px-2 py-1" data-testid="text-current-page">RingTone Points</span>
            <Link href="/referral" className="text-muted-foreground hover:text-primary transition-colors px-2 py-1" data-testid="link-referral">
              Referral
            </Link>
            <Link href="/wallet" className="text-muted-foreground hover:text-primary transition-colors px-2 py-1" data-testid="link-wallet">
              Wallet
            </Link>
            <Link href="/account" className="text-muted-foreground hover:text-primary transition-colors px-2 py-1" data-testid="link-account">
              Account
            </Link>
          </div>
        </div>

        {/* Points Balance Card - Mobile Optimized */}
        <Card className="max-w-4xl mx-auto p-4 sm:p-6 mb-4 sm:mb-8 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <div className="text-center space-y-3 sm:space-y-4">
            <h2 className="text-xl sm:text-2xl font-bold text-foreground">Ringtone Points Balance</h2>
            <div className="flex justify-center items-baseline gap-2">
              <span className="text-4xl sm:text-5xl md:text-6xl font-bold text-primary" data-testid="text-points-balance">
                {ringtonePoints.toLocaleString()}
              </span>
              <span className="text-lg sm:text-xl md:text-2xl text-muted-foreground">points</span>
            </div>
            <div className="text-base sm:text-lg text-muted-foreground">
              Equivalent Value: <span className="font-semibold text-foreground">£{(ringtonePoints / 100).toFixed(2)}</span>
            </div>
            <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto px-2">
              100 points = £1.00 • Use your points to enter competitions or save them up for bigger prizes
            </p>
          </div>
        </Card>

        {/* Transaction History - Mobile Optimized */}
        <Card className="max-w-4xl mx-auto p-4 sm:p-6">
          <h3 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6">Points Transaction History</h3>
          
          {isLoadingTransactions ? (
            <div className="text-center py-8 sm:py-12 text-muted-foreground text-sm sm:text-base">
              Loading transactions...
            </div>
          ) : pointsTransactions.length === 0 ? (
            <div className="text-center py-8 sm:py-12 text-muted-foreground">
              <p className="text-sm sm:text-base">No points transactions yet</p>
              <p className="text-xs sm:text-sm mt-2">Earn points by playing games and entering competitions!</p>
            </div>
          ) : (
            <div className="space-y-2 sm:space-y-3">
              {/* Table Header - Desktop Only */}
              <div className="hidden md:grid md:grid-cols-5 gap-4 pb-3 border-b border-border font-semibold text-sm text-muted-foreground">
                <div>Date</div>
                <div className="col-span-2">Description</div>
                <div className="text-right">Points</div>
                <div className="text-right">Order</div>
              </div>

              {/* Transaction Rows - Mobile Optimized */}
              {pointsTransactions.map((transaction, index) => {
                const pointsChange = parseFloat(transaction.amount);
                const isPositive = pointsChange > 0;

                return (
                  <div
                    key={transaction.id}
                    className="grid grid-cols-1 md:grid-cols-5 gap-2 md:gap-4 p-3 sm:p-4 rounded-lg bg-card border border-border hover:border-primary/50 transition-colors"
                    data-testid={`row-transaction-${index}`}
                  >
                    {/* Date */}
                    <div className="flex md:block justify-between md:justify-start">
                      <span className="text-xs sm:text-sm md:hidden text-muted-foreground font-medium">Date:</span>
                      <span className="text-xs sm:text-sm" data-testid={`text-date-${index}`}>
                        {format(new Date(transaction.createdAt), "dd/MM/yyyy HH:mm")}
                      </span>
                    </div>

                    {/* Description */}
                    <div className="md:col-span-2 flex md:block justify-between md:justify-start">
                      <span className="text-xs sm:text-sm md:hidden text-muted-foreground font-medium">Description:</span>
                      <span className="text-xs sm:text-sm text-right md:text-left" data-testid={`text-description-${index}`}>
                        {transaction.description}
                      </span>
                    </div>

                    {/* Points Change */}
                    <div className="md:text-right flex md:block justify-between md:justify-start">
                      <span className="text-xs sm:text-sm md:hidden text-muted-foreground font-medium">Points:</span>
                      <span
                        className={`text-sm sm:text-base font-semibold ${
                          isPositive ? "text-green-500" : "text-red-500"
                        }`}
                        data-testid={`text-points-${index}`}
                      >
                        {isPositive ? "+" : ""}{pointsChange.toLocaleString()} pts
                      </span>
                    </div>

                    {/* Order Reference */}
                    <div className="md:text-right flex md:block justify-between md:justify-start">
                      <span className="text-xs sm:text-sm md:hidden text-muted-foreground font-medium">Order:</span>
                      {transaction.orderId ? (
                        <Link
                          href="/orders"
                          className="text-xs sm:text-sm text-primary hover:underline"
                          data-testid={`link-order-${index}`}
                        >
                          View Order
                        </Link>
                      ) : (
                        <span className="text-xs sm:text-sm text-muted-foreground" data-testid={`text-no-order-${index}`}>
                          —
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Info Section - Mobile Optimized */}
        <div className="max-w-4xl mx-auto mt-4 sm:mt-8 p-4 sm:p-6 bg-muted/30 rounded-lg border border-border">
          <h4 className="text-base sm:text-lg font-semibold mb-3">How to Earn Ringtone Points</h4>
          <ul className="space-y-2 text-xs sm:text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-primary text-base">•</span>
              <span>Win points by playing Spin Wheel and Scratch Card games</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary text-base">•</span>
              <span>Refer friends to earn bonus points</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary text-base">•</span>
              <span>Special promotions and bonuses</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary text-base">•</span>
              <span>100 points = £1.00 when used for competition entries</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
