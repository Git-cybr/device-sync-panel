import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { LogOut, Activity, FileText, User as UserIcon, HeartPulse } from "lucide-react";
import DeviceSelector from "@/components/DeviceSelector";
import TelemetryCards from "@/components/TelemetryCards";
import TelemetryChart from "@/components/TelemetryChart";
import HealthAnalysis from "@/components/HealthAnalysis";
import HealthChat from "@/components/HealthChat";
import AddDeviceDialog from "@/components/AddDeviceDialog";
import AIAssistantButton from "@/components/AIAssistantButton";
import FeatureCards from "@/components/FeatureCards";
import HealthDisclaimer from "@/components/HealthDisclaimer";
import EmergencyContactsDialog from "@/components/EmergencyContactsDialog";
import MedicineInfoDialog from "@/components/MedicineInfoDialog";
import DiseasePredictionDialog from "@/components/DiseasePredictionDialog";

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [latestVitals, setLatestVitals] = useState<{hr: number; spo2: number; temp: number} | null>(null);
  const [showAISection, setShowAISection] = useState(false);
  const [unreadAlerts, setUnreadAlerts] = useState(0);
  
  // Dialog states
  const [showEmergencyContacts, setShowEmergencyContacts] = useState(false);
  const [showMedicineInfo, setShowMedicineInfo] = useState(false);
  const [showDiseasePrediction, setShowDiseasePrediction] = useState(false);

  useEffect(() => {
    // Check if user is logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
        fetchUnreadAlerts();
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchUnreadAlerts = async () => {
    try {
      const { count, error } = await supabase
        .from("alerts")
        .select("*", { count: "exact", head: true })
        .eq("is_read", false);

      if (error) throw error;
      setUnreadAlerts(count || 0);
    } catch (error) {
      console.error("Error fetching alerts:", error);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Signed out",
      description: "You have been signed out successfully",
    });
  };

  const handleDeviceAdded = () => {
    setRefreshKey(prev => prev + 1);
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-gradient-to-r from-card via-card to-primary/5">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg shadow-primary/20">
                <HeartPulse className="h-7 w-7 text-primary-foreground" />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-green-500 border-2 border-card animate-pulse" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-2xl font-bold tracking-tight">
                <span className="text-primary">VITAL</span>
                <span className="text-foreground">iT</span>
              </h1>
              <span className="text-xs text-muted-foreground font-medium tracking-wide">
                Smart Health Monitoring
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate("/reports")} className="relative">
              <FileText className="h-4 w-4 mr-2" />
              Reports
              {unreadAlerts > 0 && (
                <Badge variant="destructive" className="ml-2 px-1.5 py-0.5 text-xs">
                  {unreadAlerts}
                </Badge>
              )}
            </Button>
            <Button variant="outline" onClick={() => navigate("/profile")}>
              <UserIcon className="h-4 w-4 mr-2" />
              Profile
            </Button>
            <Button variant="outline" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-primary mb-3">Welcome to VITALiT</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Your personal health assistant is here to help you understand symptoms, learn about treatments, 
            find medicines, and monitor your vitals. We're here to guide you with care and accurate information.
          </p>
        </div>

        {/* Feature Cards */}
        <div className="mb-10">
          <FeatureCards 
            onOpenDiseasePrediction={() => setShowDiseasePrediction(true)}
            onOpenAIAssistant={() => setShowAISection(true)} 
            onOpenSymptomChecker={() => setShowAISection(true)}
            onOpenMedicineInfo={() => setShowMedicineInfo(true)}
            onOpenNearbyHospitals={() => {
              window.open("https://www.google.com/maps/search/hospitals+near+me", "_blank");
            }}
            onOpenEmergencyContacts={() => setShowEmergencyContacts(true)}
          />
        </div>

        {/* Device & Telemetry Section */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <DeviceSelector
            selectedDeviceId={selectedDeviceId}
            onDeviceChange={setSelectedDeviceId}
            refreshKey={refreshKey}
          />
          <AddDeviceDialog onDeviceAdded={handleDeviceAdded} />
        </div>

        <div className="space-y-8">
          {selectedDeviceId && (
            <>
              <TelemetryCards deviceId={selectedDeviceId} onDataUpdate={setLatestVitals} />
              <TelemetryChart deviceId={selectedDeviceId} />
            </>
          )}
          
          {!selectedDeviceId && (
            <div className="text-center py-12">
              <Activity className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-foreground mb-2">No Device Selected</h2>
              <p className="text-muted-foreground mb-4">
                Select a device from the dropdown above or add a new device to view telemetry data
              </p>
            </div>
          )}

          <div className="flex justify-center">
            <AIAssistantButton onClick={() => setShowAISection(!showAISection)} />
          </div>
          
          {showAISection && (
            <div className="grid gap-8 md:grid-cols-2">
              {latestVitals ? (
                <HealthAnalysis 
                  hr={latestVitals.hr} 
                  spo2={latestVitals.spo2} 
                  temp={latestVitals.temp} 
                />
              ) : (
                <HealthAnalysis />
              )}
              <HealthChat />
            </div>
          )}

          {/* Health Disclaimer */}
          <HealthDisclaimer />
        </div>
      </main>

      {/* Dialogs */}
      <EmergencyContactsDialog 
        open={showEmergencyContacts} 
        onOpenChange={setShowEmergencyContacts} 
      />
      <MedicineInfoDialog 
        open={showMedicineInfo} 
        onOpenChange={setShowMedicineInfo} 
      />
      <DiseasePredictionDialog 
        open={showDiseasePrediction} 
        onOpenChange={setShowDiseasePrediction} 
      />
    </div>
  );
};

export default Dashboard;
