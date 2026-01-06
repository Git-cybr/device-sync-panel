import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Stethoscope, Loader2, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface DiseasePredictionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DiseasePredictionDialog = ({ open, onOpenChange }: DiseasePredictionDialogProps) => {
  const [symptoms, setSymptoms] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const { toast } = useToast();

  const handlePredict = async () => {
    if (!symptoms.trim()) {
      toast({
        title: "Please describe your symptoms",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke("health-chat", {
        body: {
          message: `Based on these symptoms: "${symptoms}"
          
          Please provide:
          1. Possible conditions (list 2-3 most likely)
          2. Severity assessment (mild/moderate/severe)
          3. Recommended actions (home care vs. see a doctor)
          4. Warning signs to watch for
          
          Be helpful but emphasize this is not a diagnosis.`,
        },
      });

      if (error) throw error;
      setResult(data.response || data.message || "Unable to analyze symptoms.");
    } catch (error: any) {
      console.error("Error predicting disease:", error);
      toast({
        title: "Error",
        description: "Failed to analyze symptoms. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Stethoscope className="h-5 w-5 text-primary" />
            Disease Prediction
          </DialogTitle>
          <DialogDescription>
            Describe your symptoms for AI-powered health screening
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <Textarea
            placeholder="Describe your symptoms in detail (e.g., I have a headache, fever, and sore throat for the past 2 days...)"
            value={symptoms}
            onChange={(e) => setSymptoms(e.target.value)}
            rows={4}
          />
          
          <Button onClick={handlePredict} disabled={loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Stethoscope className="h-4 w-4 mr-2" />
                Analyze Symptoms
              </>
            )}
          </Button>

          {result && (
            <div className="p-4 bg-muted/50 rounded-lg space-y-2">
              <p className="text-sm whitespace-pre-wrap">{result}</p>
            </div>
          )}

          <div className="flex items-start gap-2 p-3 bg-amber-500/10 rounded-lg">
            <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground">
              This is an AI-powered screening tool for educational purposes only. It does not replace professional medical diagnosis. If you're experiencing severe symptoms, please seek immediate medical attention.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DiseasePredictionDialog;
