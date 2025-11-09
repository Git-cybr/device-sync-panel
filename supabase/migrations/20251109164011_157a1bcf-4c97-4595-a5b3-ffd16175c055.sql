-- Create reports table to store report metadata
CREATE TABLE public.reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  report_type TEXT NOT NULL, -- 'blood_test', 'xray', 'ct_scan', 'other'
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER,
  upload_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  report_date DATE,
  ai_analysis JSONB, -- Store AI analysis results
  has_abnormal_findings BOOLEAN DEFAULT false,
  notes TEXT
);

-- Enable RLS
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Create policies for reports
CREATE POLICY "Users can view their own reports"
  ON public.reports
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can upload their own reports"
  ON public.reports
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reports"
  ON public.reports
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reports"
  ON public.reports
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create alerts table for notifications
CREATE TABLE public.alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  report_id UUID REFERENCES public.reports(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL, -- 'abnormal', 'critical', 'info'
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

-- Create policies for alerts
CREATE POLICY "Users can view their own alerts"
  ON public.alerts
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own alerts"
  ON public.alerts
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own alerts"
  ON public.alerts
  FOR DELETE
  USING (auth.uid() = user_id);

-- Add profile fields for medical history
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS age INTEGER,
ADD COLUMN IF NOT EXISTS gender TEXT,
ADD COLUMN IF NOT EXISTS tb_treatment_history TEXT;

-- Create storage bucket for medical reports
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'medical-reports',
  'medical-reports',
  false,
  20971520, -- 20MB limit
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
);

-- Storage policies for medical reports
CREATE POLICY "Users can upload their own reports"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'medical-reports' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view their own reports"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'medical-reports' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own reports"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'medical-reports' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Create index for faster queries
CREATE INDEX idx_reports_user_id ON public.reports(user_id);
CREATE INDEX idx_reports_upload_date ON public.reports(upload_date DESC);
CREATE INDEX idx_alerts_user_id ON public.alerts(user_id);
CREATE INDEX idx_alerts_created_at ON public.alerts(created_at DESC);