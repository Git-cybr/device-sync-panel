import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface Device {
  id: string;
  name: string;
}

interface DeviceSelectorProps {
  selectedDeviceId: string;
  onDeviceChange: (deviceId: string) => void;
  refreshKey: number;
}

const DeviceSelector = ({ selectedDeviceId, onDeviceChange, refreshKey }: DeviceSelectorProps) => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchDevices();
  }, [refreshKey]);

  const fetchDevices = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("devices")
        .select("id, name")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setDevices(data || []);
      
      // Auto-select first device if none selected
      if (data && data.length > 0 && !selectedDeviceId) {
        onDeviceChange(data[0].id);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load devices",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 max-w-xs">
      <Label htmlFor="device-select" className="text-sm font-medium mb-2 block">
        Select Device
      </Label>
      <Select value={selectedDeviceId} onValueChange={onDeviceChange} disabled={loading || devices.length === 0}>
        <SelectTrigger id="device-select">
          <SelectValue placeholder={loading ? "Loading devices..." : "Select a device"} />
        </SelectTrigger>
        <SelectContent>
          {devices.map((device) => (
            <SelectItem key={device.id} value={device.id}>
              {device.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default DeviceSelector;
