import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { format } from "date-fns";

interface TelemetryData {
  hr: number;
  spo2: number;
  temp: number;
  ts: string;
}

interface TelemetryChartProps {
  deviceId: string;
}

const TelemetryChart = ({ deviceId }: TelemetryChartProps) => {
  const [chartData, setChartData] = useState<TelemetryData[]>([]);

  useEffect(() => {
    fetchHistoricalData();

    // Set up realtime subscription
    const channel = supabase
      .channel(`telemetry-chart-${deviceId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "telemetry",
          filter: `device_id=eq.${deviceId}`,
        },
        (payload) => {
          setChartData((prev) => [...prev, payload.new as TelemetryData].slice(-50));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [deviceId]);

  const fetchHistoricalData = async () => {
    const { data, error } = await supabase
      .from("telemetry")
      .select("hr, spo2, temp, ts")
      .eq("device_id", deviceId)
      .order("ts", { ascending: true })
      .limit(50);

    if (data && !error) {
      setChartData(data);
    }
  };

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Historical Data</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            No historical data available yet
          </div>
        </CardContent>
      </Card>
    );
  }

  const formattedData = chartData.map((item) => ({
    ...item,
    time: format(new Date(item.ts), "HH:mm:ss"),
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Live Telemetry Data</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={formattedData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="time" 
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <YAxis 
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="hr" 
              stroke="hsl(var(--chart-1))" 
              name="Heart Rate (BPM)"
              strokeWidth={2}
              dot={false}
            />
            <Line 
              type="monotone" 
              dataKey="spo2" 
              stroke="hsl(var(--chart-2))" 
              name="SpO₂ (%)"
              strokeWidth={2}
              dot={false}
            />
            <Line 
              type="monotone" 
              dataKey="temp" 
              stroke="hsl(var(--chart-3))" 
              name="Temperature (°C)"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default TelemetryChart;
