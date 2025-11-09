import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, Trash2, Brain, Loader2, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface ReportCardProps {
  report: {
    id: string;
    title: string;
    report_type: string;
    file_name: string;
    file_path: string;
    upload_date: string;
    report_date: string | null;
    has_abnormal_findings: boolean;
    ai_analysis: any;
  };
  onDelete: (id: string) => void;
  onRefresh: () => void;
}

const ReportCard = ({ report, onDelete, onRefresh }: ReportCardProps) => {
  const { toast } = useToast();
  const [analyzing, setAnalyzing] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getReportTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      blood_test: "bg-red-500/10 text-red-500",
      xray: "bg-blue-500/10 text-blue-500",
      ct_scan: "bg-purple-500/10 text-purple-500",
      mri: "bg-green-500/10 text-green-500",
      ultrasound: "bg-yellow-500/10 text-yellow-500",
      other: "bg-gray-500/10 text-gray-500",
    };
    return colors[type] || colors.other;
  };

  const handleDownload = async () => {
    try {
      const { data, error } = await supabase.storage
        .from('medical-reports')
        .download(report.file_path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = report.file_name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading report:", error);
      toast({
        title: "Error",
        description: "Failed to download report",
        variant: "destructive",
      });
    }
  };

  const handleAnalyze = async () => {
    setAnalyzing(true);
    try {
      // For now, we'll use a placeholder since document parsing requires the file content
      // In a real implementation, you'd extract text from the file first
      const { data, error } = await supabase.functions.invoke("analyze-report", {
        body: {
          reportText: `This is a ${report.report_type} report titled "${report.title}"`,
          reportType: report.report_type,
          reportId: report.id,
        },
      });

      if (error) throw error;

      toast({
        title: "Analysis Complete",
        description: "AI has analyzed your report",
      });

      setShowAnalysis(true);
      onRefresh();
    } catch (error) {
      console.error("Error analyzing report:", error);
      toast({
        title: "Error",
        description: "Failed to analyze report",
        variant: "destructive",
      });
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <Card className={report.has_abnormal_findings ? "border-destructive" : ""}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4" />
              {report.title}
            </CardTitle>
            <div className="flex flex-wrap gap-2 mt-2">
              <Badge variant="outline" className={getReportTypeColor(report.report_type)}>
                {report.report_type.replace('_', ' ')}
              </Badge>
              {report.has_abnormal_findings && (
                <Badge variant="destructive" className="flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Abnormal
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-sm text-muted-foreground space-y-1">
          <p>Uploaded: {formatDate(report.upload_date)}</p>
          {report.report_date && <p>Report Date: {formatDate(report.report_date)}</p>}
        </div>

        {showAnalysis && report.ai_analysis?.analysis && (
          <div className="p-3 bg-muted rounded-md text-sm">
            <p className="font-semibold mb-2">AI Analysis:</p>
            <p className="text-xs whitespace-pre-wrap">{report.ai_analysis.analysis.substring(0, 200)}...</p>
          </div>
        )}

        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleAnalyze}
            disabled={analyzing}
            className="flex-1"
          >
            {analyzing ? (
              <>
                <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Brain className="mr-2 h-3 w-3" />
                AI Analyze
              </>
            )}
          </Button>
          <Button size="sm" variant="outline" onClick={handleDownload}>
            <Download className="h-3 w-3" />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="sm" variant="outline">
                <Trash2 className="h-3 w-3" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Report?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete "{report.title}". This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => onDelete(report.id)}>
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
};

export default ReportCard;
