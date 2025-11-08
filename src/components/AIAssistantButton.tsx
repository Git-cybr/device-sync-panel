import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Brain, Sparkles } from "lucide-react";

interface AIAssistantButtonProps {
  onClick: () => void;
}

const AIAssistantButton = ({ onClick }: AIAssistantButtonProps) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      size="lg"
      className="relative overflow-hidden bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg hover:shadow-xl transition-all duration-300"
    >
      <div className="flex items-center gap-2">
        {isHovered ? (
          <Sparkles className="h-5 w-5 animate-pulse" />
        ) : (
          <Brain className="h-5 w-5" />
        )}
        <span className="font-semibold">AI Health Assistant</span>
      </div>
      
      {isHovered && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
      )}
    </Button>
  );
};

export default AIAssistantButton;
