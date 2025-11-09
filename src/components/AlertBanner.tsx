import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AlertBannerProps {
  alerts: Array<{
    id: string;
    alert_type: string;
    message: string;
    is_read: boolean;
  }>;
  onDismiss: () => void;
}

const AlertBanner = ({ alerts, onDismiss }: AlertBannerProps) => {
  const { toast } = useToast();

  const handleDismiss = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from("alerts")
        .update({ is_read: true })
        .eq("id", alertId);

      if (error) throw error;
      
      onDismiss();
    } catch (error) {
      console.error("Error dismissing alert:", error);
      toast({
        title: "Error",
        description: "Failed to dismiss alert",
        variant: "destructive",
      });
    }
  };

  if (alerts.length === 0) return null;

  return (
    <div className="space-y-2">
      {alerts.map((alert) => (
        <Alert key={alert.id} variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle className="flex items-center justify-between">
            <span>Important Health Alert</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDismiss(alert.id)}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </AlertTitle>
          <AlertDescription>{alert.message}</AlertDescription>
        </Alert>
      ))}
    </div>
  );
};

export default AlertBanner;
