import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Droplet, Thermometer } from "lucide-react";

interface TelemetryData {
  hr: number;
  spo2: number;
  temp: number;
  ts: string;
}

interface TelemetryCardsProps {
  deviceId: string;
  onDataUpdate?: (data: { hr: number; spo2: number; temp: number }) => void;
}

const TelemetryCards = ({ deviceId, onDataUpdate }: TelemetryCardsProps) => {
  const [latestData, setLatestData] = useState<TelemetryData | null>(null);

  useEffect(() => {
    fetchLatestData();

    // Set up realtime subscription
    const channel = supabase
      .channel(`telemetry-${deviceId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "telemetry",
          filter: `device_id=eq.${deviceId}`,
        },
        (payload) => {
          const newData = payload.new as TelemetryData;
          setLatestData(newData);
          onDataUpdate?.(newData);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [deviceId]);

  const fetchLatestData = async () => {
    const { data, error } = await supabase
      .from("telemetry")
      .select("hr, spo2, temp, ts")
      .eq("device_id", deviceId)
      .order("ts", { ascending: false })
      .limit(1)
      .single();

    if (data && !error) {
      setLatestData(data);
      onDataUpdate?.(data);
    }
  };

  if (!latestData) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No telemetry data available yet</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Heart Rate</CardTitle>
          <Activity className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold text-foreground">{latestData.hr}</div>
          <p className="text-xs text-muted-foreground mt-1">BPM</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">SpO₂</CardTitle>
          <Droplet className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold text-foreground">{latestData.spo2}</div>
          <p className="text-xs text-muted-foreground mt-1">%</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Temperature</CardTitle>
          <Thermometer className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold text-foreground">{latestData.temp}</div>
          <p className="text-xs text-muted-foreground mt-1">°C</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default TelemetryCards;
