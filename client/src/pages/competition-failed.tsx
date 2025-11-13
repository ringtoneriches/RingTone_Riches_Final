import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

export default function CheckoutFailed() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  useEffect(() => {
    toast({
      title: "Payment Failed",
      description: "Something went wrong with your payment. Please try again.",
      variant: "destructive",
    });
  }, [toast]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-4">Payment Failed</h1>
        <p className="mb-6">Unfortunately, your payment could not be processed.</p>
        <button
          onClick={() => setLocation("/")}
          className="bg-primary text-primary-foreground px-6 py-3 rounded-lg hover:opacity-90 transition-opacity"
        >
          Back to Competitions
        </button>
      </div>
    </div>
  );
}
