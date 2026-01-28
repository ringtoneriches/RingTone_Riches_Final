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
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-gradient-to-br from-gray-900 via-black to-gray-900 border-2 border-yellow-500/30 rounded-2xl max-w-md w-full p-8 relative shadow-2xl shadow-yellow-500/10 animate-in fade-in-zoom-in duration-300">
        
        {/* Close button with yellow accent */}
        <button
          onClick={handleSkip}
          className="absolute right-4 top-4 text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/10 p-1.5 rounded-full transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header with gradient text */}
        <div className="mb-8 text-center">
          <div className="inline-block mb-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-yellow-500 to-yellow-600 flex items-center justify-center mb-4 mx-auto shadow-lg shadow-yellow-500/20">
              <svg className="w-6 h-6 text-black" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
            </div>
          </div>
          
          <h2 className="text-2xl font-bold bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-400 bg-clip-text text-transparent">
            Help Us Improve!
          </h2>
          <p className="text-gray-300 mt-3 text-sm leading-relaxed">
            Tell us how you discovered Ringtone Riches. Your answer helps us reach more winners like you!
          </p>
        </div>

        {/* Options grid - dark with yellow accents */}
        <div className="grid grid-cols-1 gap-3 mb-8">
          {SOURCE_OPTIONS.map((option) => (
            <button
              key={option}
              onClick={() => {
                setSelectedSource(option);
                if (option !== "Other") setCustomSource("");
              }}
              className={`w-full text-left p-4 rounded-xl border transition-all duration-200 transform hover:scale-[1.02] ${
                selectedSource === option
                  ? "border-yellow-500 bg-gradient-to-r from-yellow-500/10 to-yellow-600/5 shadow-lg shadow-yellow-500/10"
                  : "border-gray-700 bg-gray-800/50 hover:border-yellow-500/50 hover:bg-gray-800"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`font-medium ${
                  selectedSource === option 
                    ? "text-yellow-300" 
                    : "text-gray-200"
                }`}>
                  {option}
                </span>
                {selectedSource === option && (
                  <div className="w-5 h-5 rounded-full bg-yellow-500 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-black"></div>
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Custom input for "Other" */}
        {selectedSource === "Other" && (
          <div className="mb-8 animate-in slide-in-from-top duration-300">
            <div className="relative">
              <input
                type="text"
                value={customSource}
                onChange={(e) => setCustomSource(e.target.value)}
                placeholder="Please specify how you found us..."
                className="w-full p-4 bg-gray-800 border-2 border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 transition-all"
                autoFocus
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="w-6 h-6 rounded-full bg-yellow-500/20 flex items-center justify-center">
                  <svg className="w-3 h-3 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>
            <p className="text-gray-400 text-xs mt-2 italic">
              We value every response to better understand our community
            </p>
          </div>
        )}

        {/* Action buttons with yellow gradient */}
        <div className="flex gap-4 mt-10">
          <Button
            onClick={handleSkip}
            variant="outline"
            className="flex-1 bg-transparent border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white hover:border-gray-600 transition-all duration-200 py-3 h-auto rounded-xl font-medium"
          >
            Skip for now
          </Button>
          
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || (!selectedSource && !customSource)}
            className={`flex-1 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black font-bold py-3 h-auto rounded-xl transition-all duration-200 shadow-lg shadow-yellow-500/20 hover:shadow-yellow-500/30 ${
              (!selectedSource && !customSource) ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                <span>Saving...</span>
              </div>
            ) : (
              "Submit Response"
            )}
          </Button>
        </div>

        {/* Decorative elements */}
        <div className="absolute -top-2 -left-2 w-4 h-4 rounded-full bg-yellow-500/20"></div>
        <div className="absolute -bottom-2 -right-2 w-4 h-4 rounded-full bg-yellow-500/20"></div>
      </div>
    </div>
  );
}