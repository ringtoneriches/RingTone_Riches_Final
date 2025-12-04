import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export interface SpinSegment {
  id: string;
  label: string;
  rewardType: "cash" | "points" | "prize" | "lose";
  rewardValue: number | string;
  probability: number;
  maxWins: number | null;
  currentWins?: number;
}

export interface SpinPrizeData {
  type: "spin";
  maxSpinsPerUser: number | null;
  segments: SpinSegment[];
}

interface PrizeConfigSpinProps {
  initialData?: SpinPrizeData;
  onSave: (data: SpinPrizeData) => void;
  isLoading?: boolean;
}

export default function PrizeConfigSpin({
  initialData,
  onSave,
  isLoading,
}: PrizeConfigSpinProps) {
  const { toast } = useToast();
  const [maxSpinsPerUser, setMaxSpinsPerUser] = useState<string>(
    initialData?.maxSpinsPerUser?.toString() || ""
  );
  const [segments, setSegments] = useState<SpinSegment[]>(
    initialData?.segments || [
      {
        id: crypto.randomUUID(),
        label: "£10 Cash",
        rewardType: "cash",
        rewardValue: 10,
        probability: 10,
        maxWins: 100,
        currentWins: 0,
      },
      {
        id: crypto.randomUUID(),
        label: "500 Points",
        rewardType: "points",
        rewardValue: 500,
        probability: 20,
        maxWins: null,
        currentWins: 0,
      },
      {
        id: crypto.randomUUID(),
        label: "Better Luck Next Time",
        rewardType: "lose",
        rewardValue: 0,
        probability: 70,
        maxWins: null,
        currentWins: 0,
      },
    ]
  );

  const addSegment = () => {
    setSegments([
      ...segments,
      {
        id: crypto.randomUUID(),
        label: "New Prize",
        rewardType: "cash",
        rewardValue: 0,
        probability: 0,
        maxWins: null,
        currentWins: 0,
      },
    ]);
  };

  const updateSegment = (id: string, field: keyof SpinSegment, value: any) => {
    setSegments(
      segments.map((seg) =>
        seg.id === id ? { ...seg, [field]: value } : seg
      )
    );
  };

  const removeSegment = (id: string) => {
    if (segments.length <= 2) {
      toast({
        title: "Cannot remove segment",
        description: "Wheel must have at least 2 segments",
        variant: "destructive",
      });
      return;
    }
    setSegments(segments.filter((seg) => seg.id !== id));
  };

  const totalProbability = segments.reduce(
    (sum, seg) => sum + (Number(seg.probability) || 0),
    0
  );

  // Match backend validation: allow 0.01% tolerance
  const isValid = Math.abs(totalProbability - 100) < 0.01;
  const probabilityDiff = totalProbability - 100;

  const handleSave = () => {
    if (!isValid) {
      toast({
        title: "Invalid Configuration",
        description: `Total probability must equal 100%. Current total: ${totalProbability.toFixed(2)}%. ${
          probabilityDiff > 0 
            ? `Remove ${probabilityDiff.toFixed(2)}%` 
            : `Add ${Math.abs(probabilityDiff).toFixed(2)}%`
        }`,
        variant: "destructive",
      });
      return;
    }

    // Convert segments with precise probability parsing
    const processedSegments = segments.map((seg) => {
      // Parse probability with high precision to avoid floating point errors
      const prob = parseFloat(Number(seg.probability).toFixed(2));
      
      return {
        ...seg,
        rewardValue:
          seg.rewardType === "cash" || seg.rewardType === "points"
            ? Number(seg.rewardValue)
            : seg.rewardValue,
        probability: prob,
        maxWins: seg.maxWins !== null ? Number(seg.maxWins) : null,
      };
    });

    // Verify total again before sending
    const finalTotal = processedSegments.reduce((sum, seg) => sum + seg.probability, 0);
    // console.log('Saving with segments:', processedSegments);
    // console.log('Final total before save:', finalTotal);

    onSave({
      type: "spin",
      maxSpinsPerUser: maxSpinsPerUser ? parseInt(maxSpinsPerUser) : null,
      segments: processedSegments,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-foreground mb-4">
          Spin Wheel Configuration
        </h3>

        <div className="mb-6">
          <Label>Max Spins Per User (leave empty for unlimited)</Label>
          <Input
            type="number"
            value={maxSpinsPerUser}
            onChange={(e) => setMaxSpinsPerUser(e.target.value)}
            placeholder="Unlimited"
          />
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-foreground">Wheel Segments</h4>
            <Button onClick={addSegment} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add Segment
            </Button>
          </div>

          {segments.map((segment, index) => (
            <div
              key={segment.id}
              className="bg-muted p-4 rounded-lg space-y-3 border border-border"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm text-muted-foreground">
                  Segment {index + 1}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeSegment(segment.id)}
                  className="text-red-500 hover:text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Label</Label>
                  <Input
                    value={segment.label}
                    onChange={(e) =>
                      updateSegment(segment.id, "label", e.target.value)
                    }
                    placeholder="Prize label"
                  />
                </div>

                <div>
                  <Label className="text-xs">Reward Type</Label>
                  <select
                    className="w-full p-2 border border-border rounded-md bg-background text-foreground text-sm"
                    value={segment.rewardType}
                    onChange={(e) =>
                      updateSegment(segment.id, "rewardType", e.target.value)
                    }
                  >
                    <option value="cash">Cash (£)</option>
                    <option value="points">Ringtone Points</option>
                    <option value="prize">Physical Prize</option>
                    <option value="lose">No Win</option>
                  </select>
                </div>

                {(segment.rewardType === "cash" ||
                  segment.rewardType === "points") && (
                  <div>
                    <Label className="text-xs">Reward Value</Label>
                    <Input
                      type="number"
                      step={segment.rewardType === "cash" ? "0.01" : "1"}
                      value={segment.rewardValue}
                      onChange={(e) =>
                        updateSegment(segment.id, "rewardValue", e.target.value)
                      }
                    />
                  </div>
                )}

                <div>
                  <Label className="text-xs">Probability (%) - 0 = disabled</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={segment.probability}
                    onChange={(e) =>
                      updateSegment(segment.id, "probability", e.target.value)
                    }
                    data-testid={`input-probability-${index}`}
                  />
                </div>

                <div>
                  <Label className="text-xs">Max Wins (0 = disabled)</Label>
                  <Input
                    type="number"
                    min="0"
                    value={segment.maxWins ?? ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      updateSegment(
                        segment.id,
                        "maxWins",
                        val === "" ? null : parseInt(val, 10)
                      );
                    }}
                    placeholder="Unlimited"
                    data-testid={`input-maxwins-${index}`}
                  />
                </div>
              </div>
            </div>
          ))}

          <div
            className={`p-4 rounded-lg border-2 ${
              isValid
                ? "bg-green-500/10 text-green-600 border-green-500"
                : probabilityDiff > 0
                ? "bg-yellow-500/10 text-yellow-600 border-yellow-500"
                : "bg-red-500/10 text-red-600 border-red-500"
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-6 h-6" />
              <span className="text-lg font-bold">
                Total: {totalProbability.toFixed(2)}%
              </span>
            </div>
            {!isValid && (
              <div className="text-sm font-medium ml-8">
                {probabilityDiff > 0 ? (
                  <>❌ Too high! Remove <strong>{Math.abs(probabilityDiff).toFixed(2)}%</strong></>
                ) : (
                  <>❌ Too low! Add <strong>{Math.abs(probabilityDiff).toFixed(2)}%</strong> more</>
                )}
              </div>
            )}
            {isValid && (
              <div className="text-sm font-medium ml-8">
                ✓ Perfect! Ready to save
              </div>
            )}
          </div>
        </div>
      </div>

      <Button onClick={handleSave} disabled={isLoading || !isValid} className="w-full">
        {isLoading ? "Saving..." : "Save Configuration"}
      </Button>
    </div>
  );
}