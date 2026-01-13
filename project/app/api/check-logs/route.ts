import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json({
        error: 'Missing environment variables',
        hasUrl: !!supabaseUrl,
        hasKey: !!serviceKey,
        keyPrefix: serviceKey?.substring(0, 20)
      });
    }

    // Use service role to bypass RLS and see all logs
    const supabaseAdmin = createClient(
      supabaseUrl,
      serviceKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    const { data: allLogs, error: allError } = await supabaseAdmin
      .from('voice_ai_call_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    // Get voice config
    const { data: config, error: configError } = await supabaseAdmin
      .from('voice_ai_config')
      .select('*')
      .limit(1)
      .maybeSingle();

    return NextResponse.json({
      config,
      configError: configError?.message,
      logsCount: allLogs?.length || 0,
      allLogs,
      allError: allError?.message,
      allErrorDetails: allError,
      hasServiceKey: !!serviceKey,
      urlCheck: supabaseUrl
    });
  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
