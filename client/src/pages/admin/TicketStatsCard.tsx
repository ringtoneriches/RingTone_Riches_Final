// components/admin/TicketStatsCard.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Ticket, Users } from "lucide-react";

interface TicketStatsCardProps {
  competitions: Competition[];
}

export function TicketStatsCard({ competitions }: TicketStatsCardProps) {
  const activeComps = competitions.filter(c => c.isActive && !c.isArchived);
  const totalTickets = activeComps.reduce((sum, c) => sum + (c.maxTickets || 0), 0);
  const totalSold = activeComps.reduce((sum, c) => sum + (c.soldTickets || 0), 0);
  const fillRate = totalTickets > 0 ? (totalSold / totalTickets) * 100 : 0;

  return (
    <Card className="bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Ticket className="w-5 h-5 text-yellow-500" />
          Ticket Overview
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <div className="text-2xl font-bold text-white">
              {totalTickets.toLocaleString()}
            </div>
            <div className="text-xs text-gray-400">Total Tickets</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-blue-400">
              {totalSold.toLocaleString()}
            </div>
            <div className="text-xs text-gray-400">Total Sold</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-400">
              {fillRate.toFixed(1)}%
            </div>
            <div className="text-xs text-gray-400">Fill Rate</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}