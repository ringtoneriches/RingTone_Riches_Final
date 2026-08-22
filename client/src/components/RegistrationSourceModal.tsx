import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";

const SOURCE_OPTIONS = [
  "Word of Mouth",
  "Advertising Screens",
  "Social Media",
  "Street Promotions",
  "Ringtone Riches Vehicles"
];

interface RegistrationSourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export default function RegistrationSourceModal({
  isOpen,
  onClose,
  onComplete
}: RegistrationSourceModalProps) {
  const { user } = useAuth();
  const [selectedSource, setSelectedSource] = useState<string>("");
  const [customSource, setCustomSource] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSkip = () => {
    if (user?.id) {
      localStorage.setItem(`registration_source_asked_${user.id}`, Date.now().toString());
    }
    onClose();
  };

  const handleSubmit = async () => {
    if (!selectedSource && !customSource) {
      toast({
        title: "Please select an option",
        variant: "destructive"
      });
      return;
    }
  
    setIsSubmitting(true);
    try {
      const source = selectedSource === "Other" ? customSource : selectedSource;
      
      await apiRequest("/api/user/update-registration-source", "POST", {
        source
      });
  
      // Remove the tracking since user has now answered
      if (user?.id) {
        localStorage.removeItem(`registration_source_asked_${user.id}`);
      }
  
      toast({
        title: "Thank you!",
        description: "Your response has been recorded."
      });
  
      onComplete();
    } catch (error: any) {
      toast({
        title: "Failed to save",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-2xl border border-[#C8102E]/30 bg-[#0A0A0D] p-8 shadow-[0_24px_80px_rgba(0,0,0,0.55)]">
        <button
          onClick={handleSkip}
          className="absolute right-4 top-4 rounded-full p-1.5 text-[#F1D47A] transition-all hover:bg-[#C8102E]/10 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-8 text-center">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#C8102E]/40 bg-[#C8102E]/10 px-3 py-1">
            <span className="text-[10px] font-black uppercase tracking-[0.22em] text-[#FF263D]">
              Quick question
            </span>
          </div>
          <h2 className="font-prize text-3xl text-white">HELP US IMPROVE</h2>
          <p className="mt-3 text-sm leading-relaxed text-white/50">
            Tell us how you discovered Ringtone Riches. Your answer helps us reach more winners like you!
          </p>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-3">
          {SOURCE_OPTIONS.map((option) => (
            <button
              key={option}
              onClick={() => {
                setSelectedSource(option);
                if (option !== "Other") setCustomSource("");
              }}
              className={`w-full rounded-xl border p-4 text-left transition-all duration-200 ${
                selectedSource === option
                  ? "border-[#C8102E] bg-[#C8102E]/10 shadow-[0_8px_24px_rgba(200,16,46,0.18)]"
                  : "border-white/10 bg-white/[0.03] hover:border-[#F1D47A]/40 hover:bg-white/[0.05]"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`font-medium ${
                  selectedSource === option 
                    ? "text-[#F1D47A]" 
                    : "text-white/80"
                }`}>
                  {option}
                </span>
                {selectedSource === option && (
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#C8102E]">
                    <div className="h-2 w-2 rounded-full bg-[#F1D47A]"></div>
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>

        {selectedSource === "Other" && (
          <div className="mb-8">
            <input
              type="text"
              value={customSource}
              onChange={(e) => setCustomSource(e.target.value)}
              placeholder="Please specify how you found us..."
              className="w-full rounded-xl border border-white/10 bg-white/[0.04] p-4 text-white placeholder-white/30 outline-none transition-all focus:border-[#C8102E] focus:ring-1 focus:ring-[#C8102E]"
              autoFocus
            />
            <p className="mt-2 text-xs italic text-white/35">
              We value every response to better understand our community
            </p>
          </div>
        )}

        <div className="mt-10 flex gap-4">
          <Button
            onClick={handleSkip}
            variant="outline"
            className="h-auto flex-1 rounded-xl border-white/15 bg-transparent py-3 font-medium text-white/70 hover:border-white/25 hover:bg-white/5 hover:text-white"
          >
            Skip for now
          </Button>
          
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || (!selectedSource && !customSource)}
            className={`rr-cta h-auto flex-1 py-3 ${
              (!selectedSource && !customSource) ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                <span>Saving...</span>
              </div>
            ) : (
              "Submit Response"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
