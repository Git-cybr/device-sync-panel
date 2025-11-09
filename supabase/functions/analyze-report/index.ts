import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { reportText, reportType, reportId } = await req.json();

    if (!reportText || !reportType) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate input length
    if (reportText.length > 50000) {
      return new Response(
        JSON.stringify({ error: 'Report text too long' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const systemPrompt = `You are a medical AI assistant specializing in analyzing medical reports. 
Analyze the provided ${reportType} report and provide:
1. Summary of key findings
2. Interpretation of abnormal values (if any)
3. Potential diagnoses or conditions suggested by the results
4. Recommendations for follow-up actions
5. Lifestyle advice if applicable

IMPORTANT: 
- Flag any critical or abnormal findings clearly
- Use simple language for patients to understand
- Include a disclaimer that this is AI analysis, not a medical diagnosis
- For TB-related findings, be specific about indicators
- Highlight any urgent concerns that require immediate medical attention`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Analyze this ${reportType} report:\n\n${reportText}` }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted. Please add credits to continue.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      return new Response(
        JSON.stringify({ error: 'AI analysis failed' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const analysis = data.choices[0].message.content;

    // Check for abnormal findings
    const hasAbnormal = /abnormal|critical|urgent|elevated|low|high|infection|tb|tuberculosis/i.test(analysis);

    // Update report with analysis
    if (reportId) {
      const { error: updateError } = await supabase
        .from('reports')
        .update({
          ai_analysis: { analysis, analyzed_at: new Date().toISOString() },
          has_abnormal_findings: hasAbnormal
        })
        .eq('id', reportId)
        .eq('user_id', user.id);

      if (updateError) {
        console.error('Error updating report:', updateError);
      }

      // Create alert if abnormal findings detected
      if (hasAbnormal) {
        await supabase.from('alerts').insert({
          user_id: user.id,
          report_id: reportId,
          alert_type: 'abnormal',
          message: 'Abnormal results detected in your report. Please consult a healthcare provider.',
        });
      }
    }

    return new Response(
      JSON.stringify({ analysis, hasAbnormal }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error analyzing report:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
