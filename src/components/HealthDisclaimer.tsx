import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Stethoscope, Phone } from "lucide-react";

const HealthDisclaimer = () => {
  return (
    <Card className="bg-muted/30 border-muted">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold">Important Disclaimer</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">This platform is for educational and informational purposes only.</span>{" "}
            The information provided should not replace professional medical advice, diagnosis, or treatment.
          </p>
        </div>
        <div className="flex items-start gap-3">
          <Stethoscope className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
          <p className="text-sm text-muted-foreground">
            Always consult a licensed healthcare professional before taking any medication or making health decisions.
          </p>
        </div>
        <div className="flex items-start gap-3">
          <Phone className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
          <p className="text-sm text-muted-foreground">
            In case of emergency, call your local emergency number immediately or visit the nearest hospital.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default HealthDisclaimer;
