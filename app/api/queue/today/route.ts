import { createServerClient } from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const supabase = createServerClient();
    
    // Get agent ID from query or auth
    const { searchParams } = new URL(request.url);
    const agentId = searchParams.get("agentId") || "agent-1";
    
    const today = new Date().toISOString().split("T")[0];
    const todayEnd = `${today}T23:59:59`;
    
    // Get overdue callbacks (next_follow_up_at < today)
    const { data: overdue, error: overdueErr } = await supabase
      .from("callmynt_courses")
      .select("*")
      .not("next_follow_up_at", "is", null)
      .lt("next_follow_up_at", today)
      .order("next_follow_up_at", { ascending: true })
      .limit(50);

    if (overdueErr) throw overdueErr;

    // Get today's callbacks
    const { data: todayCallbacks, error: todayErr } = await supabase
      .from("callmynt_courses")
      .select("*")
      .not("next_follow_up_at", "is", null)
      .gte("next_follow_up_at", today)
      .lte("next_follow_up_at", todayEnd)
      .order("next_follow_up_at", { ascending: true })
      .limit(50);

    if (todayErr) throw todayErr;

    // Get fresh leads from campaign queue
    const { data: queueItems, error: queueErr } = await supabase
      .from("campaign_queue")
      .select("course_id, campaign_id, campaigns(name)")
      .eq("status", "queued")
      .order("priority", { ascending: false })
      .order("position", { ascending: true })
      .limit(50);

    if (queueErr) throw queueErr;

    let freshLeads: any[] = [];
    if (queueItems && queueItems.length > 0) {
      const courseIds = queueItems.map((q: any) => q.course_id);
      const { data: courses } = await supabase
        .from("callmynt_courses")
        .select("*")
        .in("id", courseIds);
      freshLeads = courses || [];
    }

    // Get today's stats for the agent
    const todayStart = `${today}T00:00:00`;
    const { data: calls, error: callsErr } = await supabase
      .from("calls")
      .select("status, duration_seconds, disposition")
      .eq("agent_id", agentId)
      .gte("started_at", todayStart);

    if (callsErr) throw callsErr;

    const stats = {
      callsMade: calls?.length || 0,
      connects: calls?.filter((c: any) => ["answered", "completed", "wrap_up"].includes(c.status)).length || 0,
      talkMinutes: Math.round((calls?.reduce((sum: number, c: any) => sum + (c.duration_seconds || 0), 0) || 0) / 60),
      callbacksScheduled: calls?.filter((c: any) => c.disposition === "Call back").length || 0,
    };

    return NextResponse.json({
      overdue: overdue || [],
      todayCallbacks: todayCallbacks || [],
      freshLeads: freshLeads || [],
      stats,
      total: (overdue?.length || 0) + (todayCallbacks?.length || 0) + (freshLeads?.length || 0),
    });

  } catch (error: any) {
    console.error("Queue API error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to load queue" },
      { status: 500 }
    );
  }
}
