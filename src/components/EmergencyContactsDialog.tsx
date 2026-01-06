import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Phone, Ambulance, Shield, Flame, HeartPulse } from "lucide-react";

interface EmergencyContactsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const emergencyContacts = [
  {
    name: "Emergency Services",
    number: "112",
    description: "Universal emergency number",
    icon: Ambulance,
    color: "text-red-500",
  },
  {
    name: "Police",
    number: "100",
    description: "Police emergency helpline",
    icon: Shield,
    color: "text-blue-500",
  },
  {
    name: "Ambulance",
    number: "108",
    description: "Medical emergency services",
    icon: HeartPulse,
    color: "text-green-500",
  },
  {
    name: "Fire Brigade",
    number: "101",
    description: "Fire emergency services",
    icon: Flame,
    color: "text-orange-500",
  },
];

const EmergencyContactsDialog = ({ open, onOpenChange }: EmergencyContactsDialogProps) => {
  const handleCall = (number: string) => {
    window.location.href = `tel:${number}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5 text-destructive" />
            Emergency Contacts
          </DialogTitle>
          <DialogDescription>
            Quick access to emergency helplines and support services
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 mt-4">
          {emergencyContacts.map((contact) => (
            <div
              key={contact.number}
              className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full bg-muted ${contact.color}`}>
                  <contact.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium">{contact.name}</p>
                  <p className="text-sm text-muted-foreground">{contact.description}</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCall(contact.number)}
                className="font-mono font-bold"
              >
                {contact.number}
              </Button>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-4 text-center">
          In case of emergency, call immediately or visit the nearest hospital.
        </p>
      </DialogContent>
    </Dialog>
  );
};

export default EmergencyContactsDialog;
