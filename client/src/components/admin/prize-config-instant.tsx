import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export interface InstantPrize {
  id: string;
  label: string;
  rewardType: "cash" | "points" | "prize" | "lose";
  rewardValue: number | string;
  odds: number;
  quantityAvailable: number;
  quantityWon: number;
}

export interface InstantPrizeData {
  type: "instant";
  prizes: InstantPrize[];
}

interface PrizeConfigInstantProps {
  initialData?: InstantPrizeData;
  onSave: (data: InstantPrizeData) => void;
  isLoading?: boolean;
}

export default function PrizeConfigInstant({
  initialData,
  onSave,
  isLoading,
}: PrizeConfigInstantProps) {
  const { toast } = useToast();
  const [prizes, setPrizes] = useState<InstantPrize[]>(
    initialData?.prizes || [
      {
        id: crypto.randomUUID(),
        label: "£1000 Cash Prize",
        rewardType: "cash",
        rewardValue: 1000,
        odds: 0.001,
        quantityAvailable: 1,
        quantityWon: 0,
      },
      {
        id: crypto.randomUUID(),
        label: "£100 Cash Prize",
        rewardType: "cash",
        rewardValue: 100,
        odds: 0.01,
        quantityAvailable: 10,
        quantityWon: 0,
      },
      {
        id: crypto.randomUUID(),
        label: "1000 Points",
        rewardType: "points",
        rewardValue: 1000,
        odds: 0.05,
        quantityAvailable: 50,
        quantityWon: 0,
      },
    ]
  );

  const addPrize = () => {
    setPrizes([
      ...prizes,
      {
        id: crypto.randomUUID(),
        label: "New Prize",
        rewardType: "cash",
        rewardValue: 0,
        odds: 0.01,
        quantityAvailable: 1,
        quantityWon: 0,
      },
    ]);
  };

  const updatePrize = (id: string, field: keyof InstantPrize, value: any) => {
    setPrizes(
      prizes.map((prize) =>
        prize.id === id ? { ...prize, [field]: value } : prize
      )
    );
  };

  const removePrize = (id: string) => {
    setPrizes(prizes.filter((prize) => prize.id !== id));
  };

  const handleSave = () => {
    const hasInvalidOdds = prizes.some(
      (prize) => Number(prize.odds) < 0 || Number(prize.odds) > 1
    );

    if (hasInvalidOdds) {
      toast({
        title: "Invalid Configuration",
        description: "Odds must be between 0 and 1 (0% to 100%)",
        variant: "destructive",
      });
      return;
    }

    onSave({
      type: "instant",
      prizes: prizes.map((prize) => ({
        ...prize,
        rewardValue:
          prize.rewardType === "cash" || prize.rewardType === "points"
            ? Number(prize.rewardValue)
            : prize.rewardValue,
        odds: Number(prize.odds),
        quantityAvailable: Number(prize.quantityAvailable),
      })),
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-foreground mb-4">
          Instant Win Configuration
        </h3>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-foreground">Prizes</h4>
            <Button onClick={addPrize} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add Prize
            </Button>
          </div>

          {prizes.map((prize, index) => (
            <div
              key={prize.id}
              className="bg-muted p-4 rounded-lg space-y-3 border border-border"
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-medium text-sm text-muted-foreground">
                    Prize {index + 1}
                  </span>
                  <span className="ml-3 text-xs text-primary">
                    Chance: {(Number(prize.odds) * 100).toFixed(2)}%
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removePrize(prize.id)}
                  className="text-red-500 hover:text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Label</Label>
                  <Input
                    value={prize.label}
                    onChange={(e) =>
                      updatePrize(prize.id, "label", e.target.value)
                    }
                    placeholder="Prize label"
                  />
                </div>

                <div>
                  <Label className="text-xs">Reward Type</Label>
                  <select
                    className="w-full p-2 border border-border rounded-md bg-background text-foreground text-sm"
                    value={prize.rewardType}
                    onChange={(e) =>
                      updatePrize(prize.id, "rewardType", e.target.value)
                    }
                  >
                    <option value="cash">Cash (£)</option>
                    <option value="points">Ringtone Points</option>
                    <option value="prize">Physical Prize</option>
                    <option value="lose">No Win</option>
                  </select>
                </div>

                {(prize.rewardType === "cash" ||
                  prize.rewardType === "points") && (
                  <div>
                    <Label className="text-xs">Reward Value</Label>
                    <Input
                      type="number"
                      step={prize.rewardType === "cash" ? "0.01" : "1"}
                      value={prize.rewardValue}
                      onChange={(e) =>
                        updatePrize(prize.id, "rewardValue", e.target.value)
                      }
                    />
                  </div>
                )}

                <div>
                  <Label className="text-xs">Odds (0.0 to 1.0)</Label>
                  <Input
                    type="number"
                    step="0.001"
                    min="0"
                    max="1"
                    value={prize.odds}
                    onChange={(e) =>
                      updatePrize(prize.id, "odds", e.target.value)
                    }
                    placeholder="e.g., 0.01 = 1%"
                  />
                </div>

                <div>
                  <Label className="text-xs">Quantity Available</Label>
                  <Input
                    type="number"
                    value={prize.quantityAvailable}
                    onChange={(e) =>
                      updatePrize(
                        prize.id,
                        "quantityAvailable",
                        e.target.value
                      )
                    }
                  />
                </div>

                <div>
                  <Label className="text-xs">Already Won</Label>
                  <Input
                    type="number"
                    value={prize.quantityWon}
                    disabled
                    className="bg-muted"
                  />
                </div>
              </div>
            </div>
          ))}

          <div className="bg-primary/10 p-3 rounded-lg">
            <p className="text-sm text-foreground">
              <strong>How it works:</strong>
            </p>
            <ul className="text-xs text-muted-foreground mt-1 list-disc list-inside space-y-1">
              <li>Odds represent the chance of winning (0.01 = 1% chance)</li>
              <li>Each entry independently checks against prize odds</li>
              <li>Prizes become unavailable when quantity won reaches quantity available</li>
            </ul>
          </div>
        </div>
      </div>

      <Button onClick={handleSave} disabled={isLoading} className="w-full">
        {isLoading ? "Saving..." : "Save Configuration"}
      </Button>
    </div>
  );
}
