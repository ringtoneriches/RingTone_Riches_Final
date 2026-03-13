import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import AdminLayout from "@/components/admin/admin-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Plus, Pencil, Trash2, Eye, ArrowBigLeft, ArrowBigRight } from "lucide-react";
import { format } from "date-fns";

interface Faq {
  id: number;
  question: string;
  answer: string;
  createdAt: string;
  updatedAt: string;
}

// FAQ validation schema
const faqFormSchema = z.object({
  question: z.string().min(1, "Question is required").max(500, "Question is too long"),
  answer: z.string().min(1, "Answer is required"),
});

type FaqFormData = z.infer<typeof faqFormSchema>;

export default function AdminFAQManager() {
  const { toast } = useToast();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedFaq, setSelectedFaq] = useState<Faq | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const form = useForm<FaqFormData>({
    resolver: zodResolver(faqFormSchema),
    defaultValues: {
      question: "",
      answer: "",
    },
  });

  const editForm = useForm<FaqFormData>({
    resolver: zodResolver(faqFormSchema),
    defaultValues: {
      question: "",
      answer: "",
    },
  });

  // Fetch FAQs
  const { data: faqs = [], isLoading } = useQuery<Faq[]>({
    queryKey: ["/api/admin/faqs"],
  });

  // Create FAQ mutation
  const createFaqMutation = useMutation({
    mutationFn: async (data: FaqFormData) => {
      const res = await apiRequest("/api/admin/faqs", "POST", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/faqs"] });
      setCreateDialogOpen(false);
      form.reset();
      toast({ title: "FAQ created successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create FAQ",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update FAQ mutation
  const updateFaqMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: FaqFormData }) => {
      const res = await apiRequest(`/api/admin/faqs/${id}`, "PUT", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/faqs"] });
      setEditDialogOpen(false);
      setSelectedFaq(null);
      editForm.reset();
      toast({ title: "FAQ updated successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update FAQ",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete FAQ mutation
  const deleteFaqMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest(`/api/admin/faqs/${id}`, "DELETE");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/faqs"] });
      setDeleteConfirmId(null);
      toast({ title: "FAQ deleted successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to delete FAQ",
        description: error.message,
        variant: "destructive",
      });
      setDeleteConfirmId(null);
    },
  });

  const handleCreateFaq = (data: FaqFormData) => {
    createFaqMutation.mutate(data);
  };

  const handleUpdateFaq = (data: FaqFormData) => {
    if (selectedFaq) {
      updateFaqMutation.mutate({ id: selectedFaq.id, data });
    }
  };

  const handleEditClick = (faq: Faq) => {
    setSelectedFaq(faq);
    editForm.reset({
      question: faq.question,
      answer: faq.answer,
    });
    setEditDialogOpen(true);
  };

  const handleViewClick = (faq: Faq) => {
    setSelectedFaq(faq);
    setViewDialogOpen(true);
  };

  // Pagination
  const totalPages = Math.ceil(faqs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedFaqs = faqs.slice(startIndex, startIndex + itemsPerPage);

  return (
    <AdminLayout>
      <div className="space-y-4 sm:space-y-6 p-3 sm:p-4 md:p-6 max-w-full overflow-x-hidden">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-yellow-400">FAQ Management</h1>
            <p className="text-xs sm:text-sm text-gray-400 mt-1">
              Create and manage frequently asked questions
            </p>
          </div>
          <Button
            onClick={() => setCreateDialogOpen(true)}
            className="bg-yellow-400 hover:bg-yellow-500 text-black w-full sm:w-auto text-sm sm:text-base py-2 sm:py-2.5"
            data-testid="button-create-faq"
          >
            <Plus className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
            Add New FAQ
          </Button>
        </div>

        {/* Stats Card */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-white text-base sm:text-lg">FAQ Overview</CardTitle>
            <CardDescription className="text-gray-400 text-xs sm:text-sm">
              Total FAQs: {faqs.length}
            </CardDescription>
          </CardHeader>
        </Card>

        {/* FAQ List - Mobile View */}
        <div className="block md:hidden">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="p-4">
              <CardTitle className="text-white text-base sm:text-lg">Frequently Asked Questions</CardTitle>
              <CardDescription className="text-gray-400 text-xs sm:text-sm">
                List of all FAQs
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              {isLoading ? (
                <div className="text-center text-gray-500 py-6 text-sm">Loading FAQs...</div>
              ) : paginatedFaqs.length === 0 ? (
                <div className="text-center text-gray-500 py-6 text-sm">
                  No FAQs created yet
                </div>
              ) : (
                <div className="space-y-3">
                  {paginatedFaqs.map((faq) => (
                    <div key={faq.id} className="border border-zinc-800 rounded-lg p-3">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <div className="text-white font-medium text-sm line-clamp-2">{faq.question}</div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-gray-400">
                              Created: {format(new Date(faq.createdAt), "dd MMM yyyy")}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-gray-400 text-xs mb-3 line-clamp-2">
                        {faq.answer}
                      </div>

                      <div className="flex justify-end gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleViewClick(faq)}
                          className="h-7 w-7 p-0"
                          data-testid={`button-view-faq-${faq.id}`}
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEditClick(faq)}
                          className="h-7 w-7 p-0 text-blue-400"
                          data-testid={`button-edit-faq-${faq.id}`}
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setDeleteConfirmId(faq.id)}
                          className="h-7 w-7 p-0 text-red-400"
                          data-testid={`button-delete-faq-${faq.id}`}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* FAQ List - Desktop View */}
        <div className="hidden md:block bg-zinc-900 border-zinc-800 rounded-lg overflow-hidden">
          <div className="p-6 border-b border-zinc-800">
            <h3 className="text-white font-semibold text-lg">Frequently Asked Questions</h3>
            <p className="text-gray-400 text-sm">
              Manage all FAQs displayed to users
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">ID</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Question</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Answer</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Created</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="text-center text-gray-500 py-8 text-sm">
                      Loading FAQs...
                    </td>
                  </tr>
                ) : paginatedFaqs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center text-gray-500 py-8 text-sm">
                      No FAQs created yet
                    </td>
                  </tr>
                ) : (
                  paginatedFaqs.map((faq) => (
                    <tr key={faq.id} className="border-b border-zinc-800 hover:bg-zinc-800/50" data-testid={`row-faq-${faq.id}`}>
                      <td className="py-3 px-4 text-gray-400 text-sm">{faq.id}</td>
                      <td className="py-3 px-4 text-white text-sm max-w-xs truncate">{faq.question}</td>
                      <td className="py-3 px-4 text-gray-300 text-sm max-w-md truncate">{faq.answer}</td>
                      <td className="py-3 px-4 text-gray-400 text-sm">
                        {format(new Date(faq.createdAt), "MMM dd, yyyy")}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewClick(faq)}
                            className="border-zinc-700 hover:bg-zinc-800 h-8 text-xs"
                            data-testid={`button-view-faq-${faq.id}`}
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            View
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditClick(faq)}
                            className="border-zinc-700 hover:bg-zinc-800 h-8 text-xs text-blue-400"
                            data-testid={`button-edit-faq-${faq.id}`}
                          >
                            <Pencil className="h-3 w-3 mr-1" />
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => setDeleteConfirmId(faq.id)}
                            className="h-8 text-xs"
                            data-testid={`button-delete-faq-${faq.id}`}
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {paginatedFaqs.length > 0 && (
          <>
            <div className="flex flex-row justify-center items-center gap-3 sm:gap-4 my-4 sm:my-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => p - 1)}
                disabled={currentPage === 1}
                className="w-10 h-10 sm:w-auto sm:h-auto sm:px-4 text-xs sm:text-sm"
              >
                <ArrowBigLeft className="w-3 h-3 sm:w-4 sm:h-4" />
              </Button>

              <div className="flex items-center gap-1 sm:gap-2">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  if (pageNum > totalPages) return null;
                  
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(pageNum)}
                      className="w-8 h-8 sm:w-10 sm:h-10 text-xs"
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => p + 1)}
                disabled={currentPage === totalPages}
                className="w-10 h-10 sm:w-auto sm:h-auto sm:px-4 text-xs sm:text-sm"
              >
                <ArrowBigRight className="w-3 h-3 sm:w-4 sm:h-4" />
              </Button>
            </div>

            <p className="text-center text-xs sm:text-sm text-gray-400">
              Showing {paginatedFaqs.length} of {faqs.length} FAQs
            </p>
          </>
        )}

        {/* Create FAQ Dialog */}
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
            <DialogHeader>
              <DialogTitle className="text-yellow-400 text-lg sm:text-xl">Create New FAQ</DialogTitle>
              <DialogDescription className="text-gray-400 text-sm">
                Add a new frequently asked question
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleCreateFaq)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="question"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-300 text-sm sm:text-base">Question</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="e.g., How do I withdraw my winnings?"
                          className="bg-zinc-800 border-zinc-700 text-white text-sm sm:text-base"
                          data-testid="input-faq-question"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="answer"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-300 text-sm sm:text-base">Answer</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Write the answer here..."
                          className="bg-zinc-800 border-zinc-700 text-white text-sm sm:text-base min-h-[150px]"
                          data-testid="textarea-faq-answer"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex flex-col sm:flex-row gap-2 pt-4">
                  <Button
                    type="submit"
                    className="flex-1 bg-yellow-400 hover:bg-yellow-500 text-black text-sm sm:text-base py-2.5"
                    disabled={createFaqMutation.isPending}
                    data-testid="button-submit-faq"
                  >
                    {createFaqMutation.isPending ? "Creating..." : "Create FAQ"}
                  </Button>
                  <Button
                    type="button"
                    onClick={() => {
                      setCreateDialogOpen(false);
                      form.reset();
                    }}
                    variant="outline"
                    className="border-zinc-700 hover:bg-zinc-800 text-sm sm:text-base py-2.5"
                    data-testid="button-cancel-faq"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Edit FAQ Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
            <DialogHeader>
              <DialogTitle className="text-yellow-400 text-lg sm:text-xl">Edit FAQ</DialogTitle>
              <DialogDescription className="text-gray-400 text-sm">
                Update the question and answer
              </DialogDescription>
            </DialogHeader>
            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit(handleUpdateFaq)} className="space-y-4">
                <FormField
                  control={editForm.control}
                  name="question"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-300 text-sm sm:text-base">Question</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          className="bg-zinc-800 border-zinc-700 text-white text-sm sm:text-base"
                          data-testid="input-edit-faq-question"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="answer"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-300 text-sm sm:text-base">Answer</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          className="bg-zinc-800 border-zinc-700 text-white text-sm sm:text-base min-h-[150px]"
                          data-testid="textarea-edit-faq-answer"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex flex-col sm:flex-row gap-2 pt-4">
                  <Button
                    type="submit"
                    className="flex-1 bg-yellow-400 hover:bg-yellow-500 text-black text-sm sm:text-base py-2.5"
                    disabled={updateFaqMutation.isPending}
                    data-testid="button-update-faq"
                  >
                    {updateFaqMutation.isPending ? "Updating..." : "Update FAQ"}
                  </Button>
                  <Button
                    type="button"
                    onClick={() => {
                      setEditDialogOpen(false);
                      setSelectedFaq(null);
                      editForm.reset();
                    }}
                    variant="outline"
                    className="border-zinc-700 hover:bg-zinc-800 text-sm sm:text-base py-2.5"
                    data-testid="button-cancel-edit"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* View FAQ Dialog */}
        <Dialog open={viewDialogOpen} onOpenChange={() => setViewDialogOpen(false)}>
          <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-[95vw] sm:max-w-2xl p-4 sm:p-6">
            <DialogHeader>
              <DialogTitle className="text-yellow-400 text-lg sm:text-xl">FAQ Details</DialogTitle>
              <DialogDescription className="text-gray-400 text-sm">
                View full question and answer
              </DialogDescription>
            </DialogHeader>
            {selectedFaq && (
              <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                <div>
                  <Label className="text-gray-400 text-sm sm:text-base">Question</Label>
                  <p className="text-white mt-1 text-sm sm:text-base bg-zinc-800 p-3 rounded-lg">
                    {selectedFaq.question}
                  </p>
                </div>
                <div>
                  <Label className="text-gray-400 text-sm sm:text-base">Answer</Label>
                  <p className="text-white mt-1 whitespace-pre-line text-sm sm:text-base bg-zinc-800 p-3 rounded-lg">
                    {selectedFaq.answer}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-400 text-sm sm:text-base">Created</Label>
                    <p className="text-white mt-1 text-sm sm:text-base">
                      {format(new Date(selectedFaq.createdAt), "MMM dd, yyyy 'at' HH:mm")}
                    </p>
                  </div>
                  <div>
                    <Label className="text-gray-400 text-sm sm:text-base">Last Updated</Label>
                    <p className="text-white mt-1 text-sm sm:text-base">
                      {format(new Date(selectedFaq.updatedAt), "MMM dd, yyyy 'at' HH:mm")}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
          <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-[95vw] sm:max-w-md p-4 sm:p-6">
            <DialogHeader>
              <DialogTitle className="text-yellow-400 text-lg sm:text-xl">Confirm Delete</DialogTitle>
              <DialogDescription className="text-gray-400 text-sm">
                Are you sure you want to delete this FAQ? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col sm:flex-row gap-2 pt-4">
              <Button
                onClick={() => deleteConfirmId && deleteFaqMutation.mutate(deleteConfirmId)}
                className="flex-1 bg-red-600 hover:bg-red-700 text-sm sm:text-base py-2.5"
                disabled={deleteFaqMutation.isPending}
                data-testid="button-confirm-delete"
              >
                {deleteFaqMutation.isPending ? "Deleting..." : "Yes, Delete"}
              </Button>
              <Button
                onClick={() => setDeleteConfirmId(null)}
                variant="outline"
                className="border-zinc-700 hover:bg-zinc-800 text-sm sm:text-base py-2.5"
                data-testid="button-cancel-delete"
              >
                Cancel
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}