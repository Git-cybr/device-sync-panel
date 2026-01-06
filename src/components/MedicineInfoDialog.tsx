import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pill, Search, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface MedicineInfoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MedicineInfoDialog = ({ open, onOpenChange }: MedicineInfoDialogProps) => {
  const [medicineName, setMedicineName] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSearch = async () => {
    if (!medicineName.trim()) {
      toast({
        title: "Please enter a medicine name",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke("health-chat", {
        body: {
          message: `Provide detailed information about the medicine "${medicineName}". Include: 
          1. What it's used for (indications)
          2. Common dosage
          3. Side effects
          4. Precautions and warnings
          5. Drug interactions to be aware of
          
          Keep the response informative but concise.`,
        },
      });

      if (error) throw error;
      setResult(data.response || data.message || "No information found.");
    } catch (error: any) {
      console.error("Error fetching medicine info:", error);
      toast({
        title: "Error",
        description: "Failed to fetch medicine information. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pill className="h-5 w-5 text-primary" />
            Medicine Information
          </DialogTitle>
          <DialogDescription>
            Search for medication details, dosages, and precautions
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <div className="flex gap-2">
            <Input
              placeholder="Enter medicine name (e.g., Paracetamol)"
              value={medicineName}
              onChange={(e) => setMedicineName(e.target.value)}
              onKeyPress={handleKeyPress}
            />
            <Button onClick={handleSearch} disabled={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>
          </div>

          {result && (
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm whitespace-pre-wrap">{result}</p>
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            ⚠️ This information is for educational purposes only. Always consult a healthcare professional before taking any medication.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MedicineInfoDialog;
