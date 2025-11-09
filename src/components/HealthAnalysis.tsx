import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Brain, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface HealthAnalysisProps {
  hr?: number;
  spo2?: number;
  temp?: number;
}

const HealthAnalysis = ({ hr, spo2, temp }: HealthAnalysisProps) => {
  const [analysis, setAnalysis] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const analyzeVitals = async () => {
    setLoading(true);
    try {
      // If no vitals data, provide general health guidance
      if (!hr && !spo2 && !temp) {
        const { data, error } = await supabase.functions.invoke("health-chat", {
          body: { 
            messages: [
              { 
                role: "user", 
                content: "Provide general health guidance and tips for maintaining good health. Include advice on heart health, respiratory health, and temperature monitoring." 
              }
            ] 
          },
        });

        if (error) throw error;
        
        if (data?.error) {
          toast({
            title: "Error",
            description: data.error,
            variant: "destructive",
          });
          return;
        }

        setAnalysis(data.response || "Connect a device to get personalized health analysis based on your vitals.");
      } else {
        const { data, error } = await supabase.functions.invoke("analyze-vitals", {
          body: { hr, spo2, temp, type: "analyze" },
        });

        if (error) throw error;

        if (data?.error) {
          toast({
            title: "Error",
            description: data.error,
            variant: "destructive",
          });
          return;
        }

        setAnalysis(data.analysis);
      }
    } catch (error) {
      console.error("Error analyzing vitals:", error);
      toast({
        title: "Error",
        description: "Failed to analyze vitals. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          AI Health Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!analysis && (
          <>
            {!hr && !spo2 && !temp && (
              <p className="text-sm text-muted-foreground mb-4">
                Get general health guidance or connect a device for personalized analysis.
              </p>
            )}
            <Button
              onClick={analyzeVitals}
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                hr && spo2 && temp ? "Analyze Current Vitals" : "Get Health Guidance"
              )}
            </Button>
          </>
        )}
        
        {analysis && (
          <div className="space-y-3">
            <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap text-foreground">
              {analysis}
            </div>
            <Button
              onClick={analyzeVitals}
              disabled={loading}
              variant="outline"
              size="sm"
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Re-analyzing...
                </>
              ) : (
                "Analyze Again"
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default HealthAnalysis;
