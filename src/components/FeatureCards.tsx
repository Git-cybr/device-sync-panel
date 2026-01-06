import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Stethoscope, 
  MessageSquare, 
  Activity, 
  Pill, 
  Building2, 
  Phone 
} from "lucide-react";

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  variant?: "primary" | "default";
  onClick?: () => void;
}

const FeatureCard = ({ icon, title, description, variant = "default", onClick }: FeatureCardProps) => (
  <Card className="hover:shadow-lg transition-shadow duration-300">
    <CardHeader className="pb-3">
      <div className={`h-12 w-12 rounded-xl flex items-center justify-center mb-3 ${
        variant === "primary" 
          ? "bg-primary/10 text-primary" 
          : "bg-muted text-muted-foreground"
      }`}>
        {icon}
      </div>
      <CardTitle className="text-lg">{title}</CardTitle>
      <CardDescription>{description}</CardDescription>
    </CardHeader>
    <CardContent>
      <Button 
        variant={variant === "primary" ? "default" : "outline"} 
        className="w-full"
        onClick={onClick}
      >
        Get Started
      </Button>
    </CardContent>
  </Card>
);

interface FeatureCardsProps {
  onOpenAIAssistant: () => void;
  onOpenSymptomChecker: () => void;
}

const FeatureCards = ({ onOpenAIAssistant, onOpenSymptomChecker }: FeatureCardsProps) => {
  const features = [
    {
      icon: <Stethoscope className="h-6 w-6" />,
      title: "Disease Prediction",
      description: "AI-powered disease screening and early diagnosis support for various conditions",
      variant: "primary" as const,
    },
    {
      icon: <MessageSquare className="h-6 w-6" />,
      title: "AI Health Assistant",
      description: "Chat with AI to get personalized health guidance and information",
      variant: "default" as const,
      onClick: onOpenAIAssistant,
    },
    {
      icon: <Activity className="h-6 w-6" />,
      title: "Symptom Checker",
      description: "Describe your symptoms and get personalized health guidance",
      variant: "default" as const,
      onClick: onOpenSymptomChecker,
    },
    {
      icon: <Pill className="h-6 w-6" />,
      title: "Medicine Information",
      description: "Find details about medications, dosages, and precautions",
      variant: "default" as const,
    },
    {
      icon: <Building2 className="h-6 w-6" />,
      title: "Nearby Hospitals",
      description: "Locate nearby hospitals and emergency care facilities",
      variant: "default" as const,
    },
    {
      icon: <Phone className="h-6 w-6" />,
      title: "Emergency Contacts",
      description: "Quick access to emergency helplines and support services",
      variant: "default" as const,
    },
  ];

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {features.map((feature) => (
        <FeatureCard key={feature.title} {...feature} />
      ))}
    </div>
  );
};

export default FeatureCards;
