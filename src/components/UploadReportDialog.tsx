import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload } from "lucide-react";

interface UploadReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const UploadReportDialog = ({ open, onOpenChange, onSuccess }: UploadReportDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [reportType, setReportType] = useState("");
  const [reportDate, setReportDate] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [notes, setNotes] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title || !reportType || !file) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (20MB limit)
    if (file.size > 20 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "File size must be less than 20MB",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Upload file to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('medical-reports')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Insert report metadata
      const { error: insertError } = await supabase
        .from('reports')
        .insert({
          user_id: user.id,
          title,
          report_type: reportType,
          file_path: fileName,
          file_name: file.name,
          file_size: file.size,
          report_date: reportDate || null,
          notes,
        });

      if (insertError) throw insertError;

      toast({
        title: "Success",
        description: "Report uploaded successfully",
      });

      // Reset form
      setTitle("");
      setReportType("");
      setReportDate("");
      setFile(null);
      setNotes("");
      
      onSuccess();
    } catch (error) {
      console.error("Error uploading report:", error);
      toast({
        title: "Error",
        description: "Failed to upload report",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Medical Report</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Report Title *</Label>
            <Input
              id="title"
              placeholder="e.g., Blood Test - Jan 2025"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reportType">Report Type *</Label>
            <Select value={reportType} onValueChange={setReportType} required>
              <SelectTrigger>
                <SelectValue placeholder="Select report type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="blood_test">Blood Test</SelectItem>
                <SelectItem value="xray">X-Ray</SelectItem>
                <SelectItem value="ct_scan">CT Scan</SelectItem>
                <SelectItem value="mri">MRI</SelectItem>
                <SelectItem value="ultrasound">Ultrasound</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reportDate">Report Date</Label>
            <Input
              id="reportDate"
              type="date"
              value={reportDate}
              onChange={(e) => setReportDate(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="file">Upload File *</Label>
            <Input
              id="file"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              required
            />
            <p className="text-xs text-muted-foreground">
              Supported: PDF, Images (JPG, PNG), Word documents. Max 20MB
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Input
              id="notes"
              placeholder="Additional notes about this report"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default UploadReportDialog;
