import { useRef, useState } from "react";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import type { CompetitionImageFormValues } from "@/lib/competition-display";

type SlotKey = keyof CompetitionImageFormValues;

const SLOTS: {
  key: SlotKey;
  label: string;
  hint: string;
  size: string;
  testId: string;
}[] = [
  {
    key: "imageUrl",
    label: "Main picture",
    hint: "Backup picture used on wallet, orders, and sharing — and anywhere below that does not have its own picture yet.",
    size: "Any photo is fine. Square-ish works well.",
    testId: "main",
  },
  {
    key: "featuredImageUrl",
    label: "Homepage featured picture",
    hint: "Large picture on the homepage featured slider — the left side next to the prize and Enter Now.",
    size: "Best at 1200 × 1600 (tall).",
    testId: "featured",
  },
  {
    key: "cardImageUrl",
    label: "Competition card picture",
    hint: "Smaller picture on the game cards lower on the homepage and on listing pages.",
    size: "Best at 1200 × 930 (a bit wider than tall).",
    testId: "card",
  },
  {
    key: "pageImageUrl",
    label: "Game page picture",
    hint: "Tall picture on the left when someone opens this competition.",
    size: "Best at 1200 × 1800 (very tall).",
    testId: "page",
  },
];

export function CompetitionImageFields({
  values,
  onChange,
}: {
  values: CompetitionImageFormValues;
  onChange: (patch: Partial<CompetitionImageFormValues>) => void;
}) {
  const { toast } = useToast();
  const [uploadingKey, setUploadingKey] = useState<SlotKey | null>(null);
  const inputRefs = useRef<Record<SlotKey, HTMLInputElement | null>>({
    imageUrl: null,
    featuredImageUrl: null,
    cardImageUrl: null,
    pageImageUrl: null,
  });

  const uploadTo = async (key: SlotKey, file: File) => {
    setUploadingKey(key);
    try {
      const formData = new FormData();
      formData.append("image", file);

      const response = await fetch("/api/upload/competition-image", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Upload failed");
      }

      const { imagePath } = await response.json();
      onChange({ [key]: imagePath });
      toast({
        title: "Picture uploaded",
        description: "Remember to save this competition so the change goes live.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: error.message,
      });
    } finally {
      setUploadingKey(null);
    }
  };

  return (
    <div className="space-y-4 rounded-lg border border-border p-3 sm:p-4">
      <div>
        <p className="text-sm font-medium">Pictures</p>
        <p className="text-xs text-muted-foreground mt-1">
          Each picture is used in a different place on the site. If you skip one, the main picture is used instead.
        </p>
      </div>

      {SLOTS.map((slot) => {
        const url = values[slot.key];
        const uploading = uploadingKey === slot.key;
        return (
          <div key={slot.key} className="space-y-2 border-t border-border pt-3 first:border-t-0 first:pt-0">
            <Label>{slot.label}</Label>
            <p className="text-xs text-muted-foreground">{slot.hint}</p>
            <p className="text-xs text-muted-foreground">{slot.size}</p>
            <div className="flex flex-wrap gap-2">
              <input
                ref={(el) => {
                  inputRefs.current[slot.key] = el;
                }}
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    uploadTo(slot.key, file);
                    e.target.value = "";
                  }
                }}
                disabled={uploadingKey !== null}
                className="hidden"
                data-testid={`input-image-upload-${slot.testId}`}
              />
              <Button
                type="button"
                variant="outline"
                className="flex-1 min-w-[10rem]"
                disabled={uploadingKey !== null}
                onClick={() => inputRefs.current[slot.key]?.click()}
                data-testid={`button-select-image-${slot.testId}`}
              >
                <Upload className="h-4 w-4 mr-2" />
                {uploading ? "Uploading..." : url ? "Replace picture" : "Select picture"}
              </Button>
              {url && slot.key !== "imageUrl" && (
                <Button
                  type="button"
                  variant="ghost"
                  disabled={uploadingKey !== null}
                  onClick={() => onChange({ [slot.key]: "" })}
                  data-testid={`button-clear-image-${slot.testId}`}
                >
                  Use main picture
                </Button>
              )}
            </div>
            {url && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <img
                  src={url}
                  alt={`${slot.label} preview`}
                  className="h-20 w-16 object-cover rounded border"
                />
                <span className="truncate">{url.split("/").slice(-1)[0]}</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
