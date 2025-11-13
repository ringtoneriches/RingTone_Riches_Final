import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/layout/header";
import { Link } from "wouter";
import { format } from "date-fns";
import { Card } from "@/components/ui/card";
import { Competition, Ticket } from "@shared/schema";

// Group tickets by competition
interface GroupedEntry {
  competition: Competition;
  tickets: Ticket[];
}

export default function Entries() {
  const { user } = useAuth();

  const { data: tickets = [], isLoading: isLoadingTickets } = useQuery<Ticket[]>({
    queryKey: ["/api/user/tickets"],
    enabled: !!user,
  });

  const { data: competitions = [], isLoading: isLoadingCompetitions } = useQuery<Competition[]>({
    queryKey: ["/api/competitions"],
    enabled: !!user,
  });

  // Group tickets by competition using Map for O(n) efficiency
  const competitionMap = new Map(competitions.map(c => [c.id, c]));
  const groupMap = new Map<string, GroupedEntry>();

  tickets.forEach(ticket => {
    const competition = competitionMap.get(ticket.competitionId);
    if (!competition) return;

    const existing = groupMap.get(competition.id);
    if (existing) {
      existing.tickets.push(ticket);
    } else {
      groupMap.set(competition.id, {
        competition,
        tickets: [ticket],
      });
    }
  });

  // Convert Map to array and sort each competition's tickets by date (newest first)
  // Treat missing timestamps as 0 (oldest) for deterministic sorting
  const groupedEntries = Array.from(groupMap.values()).map(entry => ({
    ...entry,
    tickets: entry.tickets.sort((a, b) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bTime - aTime; // Newest first
    }),
  }));

  // Sort competitions by most recent entry (newest first)
  // Treat missing timestamps as 0 (oldest) for deterministic sorting
  groupedEntries.sort((a, b) => {
    const aTime = a.tickets[0]?.createdAt ? new Date(a.tickets[0].createdAt).getTime() : 0;
    const bTime = b.tickets[0]?.createdAt ? new Date(b.tickets[0].createdAt).getTime() : 0;
    return bTime - aTime;
  });

  const isLoading = isLoadingTickets || isLoadingCompetitions;
  const totalEntries = tickets.length;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <div className="container mx-auto px-4 py-8">
        {/* Navigation Tabs */}
        <div className="bg-muted text-center py-4 mb-8">
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <Link href="/orders" className="text-muted-foreground hover:text-primary transition-colors" data-testid="link-orders">
              Orders
            </Link>
            <span className="text-primary font-semibold" data-testid="text-current-page">Entries</span>
            <Link href="/ringtune-points" className="text-muted-foreground hover:text-primary transition-colors" data-testid="link-ringtone-points">
              RingTone Points
            </Link>
            <Link href="/referral" className="text-muted-foreground hover:text-primary transition-colors" data-testid="link-referral">
              Referral Scheme
            </Link>
            <Link href="/wallet" className="text-muted-foreground hover:text-primary transition-colors" data-testid="link-wallet">
              Wallet
            </Link>
            <Link href="/account" className="text-muted-foreground hover:text-primary transition-colors" data-testid="link-account">
              Account details
            </Link>
          </div>
        </div>

        {/* Entries Summary Card */}
        <Card className="max-w-4xl mx-auto p-6 mb-8 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-foreground">Your Competition Entries</h2>
            <div className="flex justify-center items-baseline gap-2">
              <span className="text-5xl font-bold text-primary" data-testid="text-total-entries">
                {totalEntries}
              </span>
              <span className="text-xl text-muted-foreground">
                {totalEntries === 1 ? 'entry' : 'entries'}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              Across {groupedEntries.length} {groupedEntries.length === 1 ? 'competition' : 'competitions'}
            </p>
          </div>
        </Card>

        {/* Grouped Entries */}
        <div className="max-w-4xl mx-auto space-y-6">
          {isLoading ? (
            <Card className="p-12">
              <div className="text-center text-muted-foreground">
                Loading your entries...
              </div>
            </Card>
          ) : groupedEntries.length === 0 ? (
            <Card className="p-12">
              <div className="text-center space-y-4">
                <p className="text-xl text-muted-foreground">No entries yet</p>
                <p className="text-sm text-muted-foreground">
                  Start entering competitions to see your entries here!
                </p>
                <Link href="/">
                  <button className="mt-4 px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity" data-testid="button-browse-competitions">
                    Browse Competitions
                  </button>
                </Link>
              </div>
            </Card>
          ) : (
            groupedEntries.map((entry, groupIndex) => (
              <Card 
                key={entry.competition.id} 
                className="overflow-hidden"
                data-testid={`card-competition-${groupIndex}`}
              >
                {/* Competition Header */}
                <div className="bg-muted/50 p-4 border-b border-border">
                  <div className="flex items-start gap-4">
                    {/* Competition Image */}
                    {entry.competition.imageUrl && (
                      <img
                        src={entry.competition.imageUrl}
                        alt={entry.competition.title}
                        className="w-20 h-20 object-cover rounded-lg"
                        data-testid={`img-competition-${groupIndex}`}
                      />
                    )}
                    
                    {/* Competition Info */}
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-foreground mb-1" data-testid={`text-competition-title-${groupIndex}`}>
                        {entry.competition.title}
                      </h3>
                      <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <span className="font-medium">Type:</span>
                          <span className="capitalize bg-primary/10 text-primary px-2 py-0.5 rounded" data-testid={`text-type-${groupIndex}`}>
                            {entry.competition.type}
                          </span>
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="font-medium">Entries:</span>
                          <span className="text-primary font-semibold" data-testid={`text-entry-count-${groupIndex}`}>
                            {entry.tickets.length}
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Entry Numbers */}
                <div className="p-4">
                  <h4 className="text-sm font-semibold text-muted-foreground mb-3">
                    Your Entry Numbers:
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                    {entry.tickets.map((ticket, ticketIndex) => (
                      <div
                        key={ticket.id}
                        className={`px-3 py-2 rounded-lg border text-center font-mono text-sm ${
                          ticket.isWinner
                            ? 'bg-green-500/10 border-green-500 text-green-600 dark:text-green-400 font-bold'
                            : 'bg-card border-border text-foreground'
                        }`}
                        data-testid={`text-entry-number-${groupIndex}-${ticketIndex}`}
                      >
                        {ticket.ticketNumber}
                        {ticket.isWinner && (
                          <div className="text-xs mt-1">🎉 Winner!</div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Entry Date */}
                  <div className="mt-4 pt-4 border-t border-border text-xs text-muted-foreground">
                    First entry: {(() => {
                      // Find the earliest valid timestamp
                      const validTimestamps = entry.tickets
                        .map(t => t.createdAt ? new Date(t.createdAt).getTime() : null)
                        .filter((time): time is number => time !== null);
                      
                      if (validTimestamps.length === 0) {
                        return 'Not available';
                      }
                      
                      const earliestTime = Math.min(...validTimestamps);
                      return format(new Date(earliestTime), "dd MMM yyyy 'at' HH:mm");
                    })()}
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>

        {/* Info Section */}
        {groupedEntries.length > 0 && (
          <div className="max-w-4xl mx-auto mt-8 p-6 bg-muted/30 rounded-lg border border-border">
            <h4 className="font-semibold mb-3">About Your Entries</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Each entry number represents a unique ticket in the competition</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Winning entries are highlighted in green with a celebration emoji</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>For Spin Wheel and Scratch Card games (instant wins), play your entries from the Games page</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Regular competition winners are drawn when all tickets are sold or at the scheduled draw date</span>
              </li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
