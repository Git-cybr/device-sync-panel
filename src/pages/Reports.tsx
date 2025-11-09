import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { FileText, Upload, Download, Trash2, Search, AlertCircle, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import UploadReportDialog from "@/components/UploadReportDialog";
import ReportCard from "@/components/ReportCard";
import AlertBanner from "@/components/AlertBanner";

interface Report {
  id: string;
  title: string;
  report_type: string;
  file_name: string;
  file_path: string;
  upload_date: string;
  report_date: string | null;
  has_abnormal_findings: boolean;
  ai_analysis: any;
}

interface Alert {
  id: string;
  alert_type: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

const Reports = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [reports, setReports] = useState<Report[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [aiQuery, setAiQuery] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    checkAuth();
    fetchReports();
    fetchAlerts();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
    }
  };

  const fetchReports = async () => {
    try {
      const { data, error } = await supabase
        .from("reports")
        .select("*")
        .order("upload_date", { ascending: false });

      if (error) throw error;
      setReports(data || []);
    } catch (error) {
      console.error("Error fetching reports:", error);
      toast({
        title: "Error",
        description: "Failed to load reports",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAlerts = async () => {
    try {
      const { data, error } = await supabase
        .from("alerts")
        .select("*")
        .eq("is_read", false)
        .order("created_at", { ascending: false })
        .limit(5);

      if (error) throw error;
      setAlerts(data || []);
    } catch (error) {
      console.error("Error fetching alerts:", error);
    }
  };

  const handleAISearch = async () => {
    if (!aiQuery.trim()) return;

    setAiLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("health-chat", {
        body: { 
          messages: [
            { role: "user", content: `Context: User has medical reports. Query: ${aiQuery}` }
          ] 
        },
      });

      if (error) throw error;
      
      // For non-streaming response
      if (data.response) {
        setAiResponse(data.response);
      }
    } catch (error) {
      console.error("Error with AI search:", error);
      toast({
        title: "Error",
        description: "AI search failed. Please try again.",
        variant: "destructive",
      });
    } finally {
      setAiLoading(false);
    }
  };

  const handleDeleteReport = async (reportId: string) => {
    try {
      const { error } = await supabase
        .from("reports")
        .delete()
        .eq("id", reportId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Report deleted successfully",
      });

      fetchReports();
    } catch (error) {
      console.error("Error deleting report:", error);
      toast({
        title: "Error",
        description: "Failed to delete report",
        variant: "destructive",
      });
    }
  };

  const filteredReports = reports.filter(report =>
    report.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    report.report_type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const unreadAlerts = alerts.filter(a => !a.is_read);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Medical Reports</h1>
              <p className="text-muted-foreground">Upload, view, and analyze your medical reports</p>
            </div>
          </div>
          <Button onClick={() => setShowUploadDialog(true)} size="lg">
            <Upload className="mr-2 h-5 w-5" />
            Upload Report
          </Button>
        </div>

        {/* Alerts Banner */}
        {unreadAlerts.length > 0 && (
          <AlertBanner alerts={unreadAlerts} onDismiss={fetchAlerts} />
        )}

        {/* AI Search Bar */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5 text-primary" />
              AI Health Assistant
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Ask about your reports: 'What does my blood test mean?' or 'Do I have signs of TB?'"
                value={aiQuery}
                onChange={(e) => setAiQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAISearch()}
              />
              <Button onClick={handleAISearch} disabled={aiLoading}>
                {aiLoading ? "Analyzing..." : "Search"}
              </Button>
            </div>
            {aiResponse && (
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm whitespace-pre-wrap">{aiResponse}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  ⚠️ This is AI-generated information for educational purposes only. Not a medical diagnosis.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Reports Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Your Reports ({filteredReports.length})
              </span>
              <Input
                placeholder="Search reports..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-xs"
              />
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-center text-muted-foreground py-8">Loading reports...</p>
            ) : filteredReports.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">No reports uploaded yet</p>
                <Button onClick={() => setShowUploadDialog(true)}>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Your First Report
                </Button>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredReports.map((report) => (
                  <ReportCard
                    key={report.id}
                    report={report}
                    onDelete={handleDeleteReport}
                    onRefresh={fetchReports}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <UploadReportDialog
        open={showUploadDialog}
        onOpenChange={setShowUploadDialog}
        onSuccess={() => {
          fetchReports();
          setShowUploadDialog(false);
        }}
      />
    </div>
  );
};

export default Reports;
