import { supabase } from "@/lib/supabase";

type QueryResult<T> = {
  data: T | null;
  error: { message?: string } | null;
  count?: number | null;
};

export const TABLES = {
  courses: ["callmynt_courses", "courses"],
  orders: ["callmynt_orders", "orders"],
  samples: ["sample_shipments"],
  calls: ["calls"],
  recordings: ["call_recordings"],
  transcripts: ["call_transcripts"],
  analysis: ["call_analysis"],
  coachingReports: ["coaching_reports"],
  campaigns: ["campaigns"],
  queue: ["campaign_queue"],
  holdQueue: ["hold_queue"],
  sms: ["sms_messages"],
} as const;

async function tryTables<T>(
  tables: readonly string[],
  runner: (table: string) => Promise<QueryResult<T>>
): Promise<QueryResult<T> & { table: string | null }> {
  let lastError: QueryResult<T>["error"] = null;

  for (const table of tables) {
    const result = await runner(table);
    if (!result.error) {
      return { ...result, table };
    }
    lastError = result.error;
  }

  return {
    data: null,
    error: lastError ?? { message: "No matching table worked." },
    count: null,
    table: null,
  };
}

export async function queryWithFallback<T>(
  tables: readonly string[],
  runner: (table: string) => Promise<QueryResult<T>>
) {
  return tryTables(tables, runner);
}

export async function insertWithFallback<T>(
  tables: readonly string[],
  payload: Record<string, unknown> | Record<string, unknown>[]
) {
  return tryTables<T>(tables, async (table) => {
    const result = await supabase.from(table).insert(payload).select();
    return {
      data: (result.data as T | null) ?? null,
      error: result.error,
      count: null,
    };
  });
}

export async function updateWithFallback<T>(
  tables: readonly string[],
  id: string,
  payload: Record<string, unknown>
) {
  return tryTables<T>(tables, async (table) => {
    const result = await supabase.from(table).update(payload).eq("id", id).select();
    return {
      data: (result.data as T | null) ?? null,
      error: result.error,
      count: null,
    };
  });
}

export async function deleteWithFallback(
  tables: readonly string[],
  id: string
) {
  return tryTables<null>(tables, async (table) => {
    const result = await supabase.from(table).delete().eq("id", id);
    return {
      data: null,
      error: result.error,
      count: null,
    };
  });
}

export function parseCsvRows(text: string) {
  const rows: string[][] = [];
  let cell = "";
  let row: string[] = [];
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        cell += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(cell.trim());
      cell = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") {
        i += 1;
      }
      row.push(cell.trim());
      if (row.some((value) => value.length > 0)) {
        rows.push(row);
      }
      row = [];
      cell = "";
      continue;
    }

    cell += char;
  }

  if (cell.length > 0 || row.length > 0) {
    row.push(cell.trim());
    if (row.some((value) => value.length > 0)) {
      rows.push(row);
    }
  }

  return rows;
}

export function normalizePhone(phone: string | null | undefined) {
  return (phone ?? "").replace(/\D/g, "");
}

export async function fetchCoursesForSelection() {
  // Supabase defaults to 1000 rows — fetch all with pagination
  const allRows: any[] = [];
  let from = 0;
  const pageSize = 1000;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await supabase
      .from('callmynt_courses')
      .select('id, name, course_type, city, state, buyer_name, buyer_title, pipeline_stage, total_attempts, main_phone, pro_shop_phone')
      .order('name')
      .range(from, from + pageSize - 1);

    if (error) return { data: allRows, error, count: null };
    allRows.push(...(data || []));
    hasMore = (data?.length || 0) === pageSize;
    from += pageSize;
  }

  return { data: allRows, error: null, count: null };
}

export async function fetchCampaignsWithCounts() {
  const campaignsQuery = await supabase
    .from("campaigns")
    .select("*")
    .order("created_at", { ascending: false });

  if (campaignsQuery.error) {
    return { data: [], error: campaignsQuery.error };
  }

  const campaigns = campaignsQuery.data ?? [];
  const withCounts = await Promise.all(
    campaigns.map(async (campaign) => {
      const countQuery = await supabase
        .from("campaign_queue")
        .select("*", { count: "exact", head: true })
        .eq("campaign_id", campaign.id);

      return {
        ...campaign,
        course_count: countQuery.count ?? 0,
      };
    })
  );

  return { data: withCounts, error: null };
}
