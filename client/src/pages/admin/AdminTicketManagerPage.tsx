// pages/admin/AdminTicketManagerPage.tsx
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Competition } from "@shared/schema";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
} from "@/components/ui/dialog";
import {
  Ticket,
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Infinity,
} from "lucide-react";

import AdminLayout from "@/components/admin/admin-layout";
import AdminTicketManager from "./AdminTicketManager";

export default function AdminTicketManagerPage() {
  const [selectedCompetition, setSelectedCompetition] = useState<Competition | null>(null);
  const [showTicketManager, setShowTicketManager] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("active");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const { toast } = useToast();

  const { data: competitions = [], isLoading, refetch } = useQuery<Competition[]>({
    queryKey: ["/api/admin/competitions"],
    enabled: true,
  });

  const filteredCompetitions = competitions.filter(comp => {
    const matchesSearch = comp.title.toLowerCase().includes(searchTerm.toLowerCase());
    let matchesStatus = true;
    if (statusFilter === "active") {
      matchesStatus = comp.isActive && !comp.isArchived;
    } else if (statusFilter === "inactive") {
      matchesStatus = !comp.isActive && !comp.isArchived;
    } else if (statusFilter === "archived") {
      matchesStatus = comp.isArchived;
    } else if (statusFilter === "sold_out") {
      matchesStatus = comp.maxTickets ? comp.soldTickets >= comp.maxTickets : false;
    }
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredCompetitions.length / itemsPerPage);
  const paginatedCompetitions = filteredCompetitions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleManageTickets = (competition: Competition) => {
    setSelectedCompetition(competition);
    setShowTicketManager(true);
  };

  const getStatusBadge = (comp: Competition) => {
    if (comp.isArchived) {
      return <Badge variant="secondary" className="bg-gray-600 text-[10px] sm:text-xs">Archived</Badge>;
    }
    if (!comp.isActive) {
      return <Badge variant="destructive" className="text-[10px] sm:text-xs">Inactive</Badge>;
    }
    if (comp.maxTickets && comp.soldTickets >= comp.maxTickets) {
      return <Badge className="bg-red-500 text-[10px] sm:text-xs">Sold Out</Badge>;
    }
    if (comp.maxTickets && (comp.maxTickets - comp.soldTickets) / comp.maxTickets < 0.1) {
      return <Badge className="bg-orange-500 text-[10px] sm:text-xs">Almost Full</Badge>;
    }
    return <Badge className="bg-green-500 text-[10px] sm:text-xs">Active</Badge>;
  };

  const getFillRate = (comp: Competition) => {
    if (!comp.maxTickets) return null;
    return ((comp.soldTickets || 0) / comp.maxTickets) * 100;
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-yellow-500" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white">Ticket Management</h1>
            <p className="text-gray-400 text-xs sm:text-sm mt-1">
              Manage total ticket supply for all competitions
            </p>
          </div>
          <Button
            onClick={() => refetch()}
            variant="outline"
            size="sm"
            className="border-gray-600 text-gray-300 w-full sm:w-auto text-xs sm:text-sm"
          >
            <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5" />
            Refresh
          </Button>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
          <Card className="bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700">
            <CardContent className="p-3 sm:p-4">
              <div className="text-[10px] sm:text-sm text-gray-400">Total Competitions</div>
              <div className="text-lg sm:text-2xl font-bold text-white mt-0.5 sm:mt-1">{competitions.length}</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700">
            <CardContent className="p-3 sm:p-4">
              <div className="text-[10px] sm:text-sm text-gray-400">Active</div>
              <div className="text-lg sm:text-2xl font-bold text-green-400 mt-0.5 sm:mt-1">
                {competitions.filter(c => c.isActive && !c.isArchived).length}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700">
            <CardContent className="p-3 sm:p-4">
              <div className="text-[10px] sm:text-sm text-gray-400">Sold Out</div>
              <div className="text-lg sm:text-2xl font-bold text-orange-400 mt-0.5 sm:mt-1">
                {competitions.filter(c => c.maxTickets && c.soldTickets >= c.maxTickets).length}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700">
            <CardContent className="p-3 sm:p-4">
              <div className="text-[10px] sm:text-sm text-gray-400">Total Sold</div>
              <div className="text-lg sm:text-2xl font-bold text-blue-400 mt-0.5 sm:mt-1 truncate">
                {competitions.reduce((sum, c) => sum + (c.soldTickets || 0), 0).toLocaleString()}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700">
          <CardContent className="p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
              <div className="flex-1">
                <Label className="text-gray-300 mb-1 sm:mb-2 block text-xs sm:text-sm">Search</Label>
                <div className="relative">
                  <Search className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-500" />
                  <Input
                    placeholder="Search competitions..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="pl-8 sm:pl-9 bg-gray-800 border-gray-600 text-white text-xs sm:text-sm h-9 sm:h-10"
                  />
                </div>
              </div>
              <div className="w-full sm:w-40 md:w-48">
                <Label className="text-gray-300 mb-1 sm:mb-2 block text-xs sm:text-sm">Status</Label>
                <Select value={statusFilter} onValueChange={(val) => {
                  setStatusFilter(val);
                  setCurrentPage(1);
                }}>
                  <SelectTrigger className="bg-gray-800 border-gray-600 text-white text-xs sm:text-sm h-9 sm:h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="sold_out">Sold Out</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Competitions - Desktop Table + Mobile Cards */}
        <Card className="bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700">
          <CardHeader className="px-3 sm:px-6 py-3 sm:py-6">
            <CardTitle className="text-white flex items-center gap-2 text-base sm:text-lg">
              <Ticket className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500" />
              Competitions
            </CardTitle>
            <CardDescription className="text-gray-400 text-xs sm:text-sm">
              Select a competition to manage its ticket supply
            </CardDescription>
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-4 sm:pb-6">
            {paginatedCompetitions.length === 0 ? (
              <div className="text-center py-8 sm:py-12 text-gray-400 text-sm">
                No competitions found
              </div>
            ) : (
              <>
                {/* DESKTOP TABLE - Hidden below lg */}
                <div className="hidden lg:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-gray-700">
                        <TableHead className="text-gray-400">Title</TableHead>
                        <TableHead className="text-gray-400">Type</TableHead>
                        <TableHead className="text-gray-400">Status</TableHead>
                        <TableHead className="text-gray-400">Price</TableHead>
                        <TableHead className="text-gray-400">Tickets</TableHead>
                        <TableHead className="text-gray-400">Fill Rate</TableHead>
                        <TableHead className="text-gray-400">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedCompetitions.map((comp) => {
                        const fillRate = getFillRate(comp);
                        const isUnlimited = !comp.maxTickets || comp.maxTickets === 0;
                        return (
                          <TableRow key={comp.id} className="border-gray-700">
                            <TableCell className="text-white font-medium">
                              {comp.title}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="border-gray-600 text-gray-300">
                                {comp.type}
                              </Badge>
                            </TableCell>
                            <TableCell>{getStatusBadge(comp)}</TableCell>
                            <TableCell className="text-white">
                              £{parseFloat(comp.ticketPrice).toFixed(2)}
                            </TableCell>
                            <TableCell className="text-white">
                              {comp.soldTickets?.toLocaleString() || 0} /{" "}
                              {isUnlimited ? (
                                <span className="text-green-400">∞ Unlimited</span>
                              ) : (
                                comp.maxTickets?.toLocaleString()
                              )}
                            </TableCell>
                            <TableCell>
                              {fillRate !== null ? (
                                <div className="flex items-center gap-2">
                                  <div className="w-20 h-2 bg-gray-700 rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-yellow-500 rounded-full"
                                      style={{ width: `${Math.min(fillRate, 100)}%` }}
                                    />
                                  </div>
                                  <span className="text-gray-400 text-xs">
                                    {fillRate.toFixed(0)}%
                                  </span>
                                </div>
                              ) : (
                                <span className="text-gray-500 text-xs">Unlimited</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Button
                                onClick={() => handleManageTickets(comp)}
                                size="sm"
                                className="bg-yellow-600 hover:bg-yellow-700"
                                disabled={comp.isArchived}
                              >
                                <Ticket className="w-4 h-4 mr-2" />
                                Manage Tickets
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

                {/* MOBILE CARDS - Visible below lg */}
                <div className="lg:hidden space-y-2">
                  {paginatedCompetitions.map((comp) => {
                    const fillRate = getFillRate(comp);
                    const isUnlimited = !comp.maxTickets || comp.maxTickets === 0;
                    return (
                      <div
                        key={comp.id}
                        className="bg-gray-800/50 rounded-lg border border-gray-700 p-3 space-y-2.5"
                      >
                        {/* Title + Status */}
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="text-white font-medium text-sm flex-1 min-w-0 line-clamp-2">
                            {comp.title}
                          </h3>
                          <div className="flex-shrink-0">{getStatusBadge(comp)}</div>
                        </div>

                        {/* Type + Price row */}
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className="border-gray-600 text-gray-300 text-[10px]">
                            {comp.type}
                          </Badge>
                          <span className="text-white font-semibold text-sm">
                            £{parseFloat(comp.ticketPrice).toFixed(2)}
                          </span>
                        </div>

                        {/* Tickets */}
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-400">Tickets:</span>
                          <span className="text-white font-medium">
                            {comp.soldTickets?.toLocaleString() || 0}
                            <span className="text-gray-500"> / </span>
                            {isUnlimited ? (
                              <span className="text-green-400 inline-flex items-center gap-0.5">
                                <Infinity className="w-3 h-3" /> Unlimited
                              </span>
                            ) : (
                              comp.maxTickets?.toLocaleString()
                            )}
                          </span>
                        </div>

                        {/* Fill Rate Bar */}
                        {fillRate !== null && (
                          <div>
                            <div className="flex justify-between text-[10px] mb-1">
                              <span className="text-gray-400">Fill Rate</span>
                              <span className="text-gray-300 font-medium">{fillRate.toFixed(0)}%</span>
                            </div>
                            <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full"
                                style={{ width: `${Math.min(fillRate, 100)}%` }}
                              />
                            </div>
                          </div>
                        )}

                        {/* Action */}
                        <Button
                          onClick={() => handleManageTickets(comp)}
                          size="sm"
                          disabled={comp.isArchived}
                          className="bg-yellow-600 hover:bg-yellow-700 w-full text-xs h-8"
                        >
                          <Ticket className="w-3.5 h-3.5 mr-1.5" />
                          Manage Tickets
                        </Button>
                      </div>
                    );
                  })}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 pt-4 border-t border-gray-700">
                    <div className="text-xs sm:text-sm text-gray-400">
                      Showing {((currentPage - 1) * itemsPerPage) + 1} to{" "}
                      {Math.min(currentPage * itemsPerPage, filteredCompetitions.length)} of{" "}
                      {filteredCompetitions.length}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="border-gray-600 text-gray-300 h-8 w-8 p-0"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      <span className="text-xs sm:text-sm text-gray-400 min-w-[60px] text-center font-medium">
                        {currentPage} / {totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="border-gray-600 text-gray-300 h-8 w-8 p-0"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Ticket Manager Dialog */}
      <Dialog open={showTicketManager} onOpenChange={setShowTicketManager}>
        <DialogContent className="max-w-3xl w-[95vw] sm:w-full bg-transparent border-0 p-0 max-h-[90vh] sm:max-h-[85vh] overflow-hidden flex flex-col">
          {/* Mobile close button */}
          <div className="sm:hidden flex justify-end px-2 pt-2 pb-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowTicketManager(false)}
              className="text-gray-400 h-8 w-8 p-0 text-lg"
            >
              ✕
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto px-0.5 sm:px-0 pb-2 sm:pb-0">
            {selectedCompetition && (
              <AdminTicketManager
                competition={selectedCompetition}
                onClose={() => setShowTicketManager(false)}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}