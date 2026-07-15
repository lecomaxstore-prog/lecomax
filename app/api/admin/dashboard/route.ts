import { NextRequest, NextResponse } from "next/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  verifySessionToken,
  verifyStaffPermissionsToken,
} from "@/lib/admin-session";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const BUSINESS_TIME_ZONE = "Africa/Casablanca";
const LOW_STOCK_THRESHOLD = 3;
const PAGE_SIZE = 1_000;
const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "shipped",
  "delivered",
  "cancelled",
] as const;

type OrderStatus = (typeof ORDER_STATUSES)[number];
type OrderSummary = {
  total: unknown;
  status: unknown;
};
type PeriodOrder = OrderSummary & {
  created_at: unknown;
};
type RecentOrderRow = {
  id: unknown;
  order_number: unknown;
  customer_name: unknown;
  total: unknown;
  status: unknown;
  created_at: unknown;
};

const NO_STORE_HEADERS = {
  "Cache-Control": "private, no-store, no-cache, max-age=0, must-revalidate",
  Pragma: "no-cache",
  Expires: "0",
};

function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: NO_STORE_HEADERS });
}

function datePartsInCasablanca(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: BUSINESS_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value);

  return {
    year: value("year"),
    month: value("month"),
    day: value("day"),
    hour: value("hour"),
    minute: value("minute"),
    second: value("second"),
  };
}

function formatCasablancaDate(date: Date) {
  const { year, month, day } = datePartsInCasablanca(date);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function addCalendarDays(dateKey: string, amount: number) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + amount));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
}

/** Convert a Casablanca calendar midnight to its corresponding UTC instant. */
function casablancaMidnightToUtc(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const intendedWallTime = Date.UTC(year, month - 1, day);
  let utcGuess = intendedWallTime;

  // Recalculate twice so this also works on Morocco's daylight-saving transitions.
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const local = datePartsInCasablanca(new Date(utcGuess));
    const representedWallTime = Date.UTC(
      local.year,
      local.month - 1,
      local.day,
      local.hour,
      local.minute,
      local.second
    );
    utcGuess += intendedWallTime - representedWallTime;
  }

  return new Date(utcGuess);
}

function toAmount(value: unknown) {
  const amount = typeof value === "number" ? value : Number(value);
  return Number.isFinite(amount) ? amount : 0;
}

function roundAmount(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function isStatus(value: unknown): value is OrderStatus {
  return typeof value === "string" && ORDER_STATUSES.includes(value as OrderStatus);
}

async function fetchAllPages<T>(
  loadPage: (from: number, to: number) => PromiseLike<{
    data: T[] | null;
    error: { message?: string } | null;
  }>
) {
  const rows: T[] = [];

  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await loadPage(from, from + PAGE_SIZE - 1);
    if (error) throw error;
    const page = data ?? [];
    rows.push(...page);
    if (page.length < PAGE_SIZE) break;
  }

  return rows;
}

async function countProducts(
  supabase: SupabaseClient,
  lowStockOnly: boolean
) {
  let query = supabase
    .from("products")
    .select("id", { count: "exact", head: true });

  if (lowStockOnly) {
    query = query.eq("active", true).lte("stock", LOW_STOCK_THRESHOLD);
  }

  const { count, error } = await query;
  if (error || count === null) throw error ?? new Error("Product count unavailable");
  return count;
}

export async function GET(request: NextRequest) {
  const sessionToken = request.cookies.get("admin_session")?.value;
  const sessionEmail = sessionToken ? await verifySessionToken(sessionToken) : null;
  if (!sessionEmail) {
    return json({ error: "Unauthorized" }, 401);
  }

  const staffToken = request.cookies.get("staff_permissions")?.value;
  let permissions: string[] | null = null;
  if (staffToken) {
    const verifiedPermissions = await verifyStaffPermissionsToken(staffToken);
    if (
      !verifiedPermissions ||
      !verifiedPermissions.every((permission) => typeof permission === "string")
    ) {
      return json({ error: "Invalid permissions" }, 403);
    }
    permissions = [...new Set(verifiedPermissions)];
  } else {
    const ownerEmail = (process.env.ADMIN_EMAIL ?? "contact@lecomax.com").trim().toLowerCase();
    if (sessionEmail.trim().toLowerCase() !== ownerEmail) {
      return json({ error: "Missing staff permissions" }, 403);
    }
  }

  const rawDays = request.nextUrl.searchParams.get("days");
  if (rawDays !== null && rawDays !== "7" && rawDays !== "30") {
    return json({ error: "days must be 7 or 30" }, 400);
  }
  const days: 7 | 30 = rawDays === "30" ? 30 : 7;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    console.error("[admin/dashboard] Supabase server configuration is missing");
    return json({ error: "Unable to load dashboard data" }, 500);
  }

  const generatedAt = new Date();
  const todayKey = formatCasablancaDate(generatedAt);
  const firstDateKey = addCalendarDays(todayKey, -(days - 1));
  const nextDateKey = addCalendarDays(todayKey, 1);
  const periodStart = casablancaMidnightToUtc(firstDateKey).toISOString();
  const periodEnd = casablancaMidnightToUtc(nextDateKey).toISOString();
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  try {
    const [products, lowStock, allOrders, periodOrders, recentResult] =
      await Promise.all([
        countProducts(supabase, false),
        countProducts(supabase, true),
        fetchAllPages<OrderSummary>((from, to) =>
          supabase
            .from("orders")
            .select("total,status")
            .order("created_at", { ascending: true })
            .order("id", { ascending: true })
            .range(from, to)
        ),
        fetchAllPages<PeriodOrder>((from, to) =>
          supabase
            .from("orders")
            .select("total,status,created_at")
            .gte("created_at", periodStart)
            .lt("created_at", periodEnd)
            .order("created_at", { ascending: true })
            .order("id", { ascending: true })
            .range(from, to)
        ),
        supabase
          .from("orders")
          .select(
            "id,order_number,customer_name:customer->>name,total,status,created_at"
          )
          .order("created_at", { ascending: false })
          .limit(6),
      ]);

    if (recentResult.error) throw recentResult.error;

    const statusCounts: Record<OrderStatus, number> = {
      pending: 0,
      confirmed: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
    };
    let orderValue = 0;
    for (const order of allOrders) {
      if (isStatus(order.status)) statusCounts[order.status] += 1;
      if (order.status !== "cancelled") orderValue += toAmount(order.total);
    }

    const daily = Array.from({ length: days }, (_, index) => ({
      date: addCalendarDays(firstDateKey, index),
      orderValue: 0,
      orders: 0,
    }));
    const dailyByDate = new Map(daily.map((day) => [day.date, day]));
    let periodOrderValue = 0;

    for (const order of periodOrders) {
      if (typeof order.created_at !== "string") continue;
      const createdAt = new Date(order.created_at);
      if (Number.isNaN(createdAt.getTime())) continue;
      const bucket = dailyByDate.get(formatCasablancaDate(createdAt));
      if (!bucket) continue;

      bucket.orders += 1;
      if (order.status !== "cancelled") {
        const amount = toAmount(order.total);
        bucket.orderValue += amount;
        periodOrderValue += amount;
      }
    }

    const recentOrders = ((recentResult.data ?? []) as RecentOrderRow[]).map(
      (order) => ({
        id: typeof order.id === "string" ? order.id : String(order.id ?? ""),
        orderNumber:
          typeof order.order_number === "string" ? order.order_number : "",
        customerName:
          typeof order.customer_name === "string" && order.customer_name.trim()
            ? order.customer_name.trim()
            : "Client",
        total: roundAmount(toAmount(order.total)),
        status:
          typeof order.status === "string" && order.status.trim()
            ? order.status.trim()
            : "unknown",
        createdAt:
          typeof order.created_at === "string" ? order.created_at : "",
      })
    );

    return json({
      stats: {
        products,
        orders: allOrders.length,
        orderValue: roundAmount(orderValue),
        ...statusCounts,
        lowStock,
      },
      period: {
        days,
        orderValue: roundAmount(periodOrderValue),
        orders: periodOrders.length,
        daily: daily.map((day) => ({
          ...day,
          orderValue: roundAmount(day.orderValue),
        })),
      },
      recentOrders,
      permissions,
      generatedAt: generatedAt.toISOString(),
    });
  } catch (error) {
    console.error("[admin/dashboard] Failed to query dashboard data", error);
    return json({ error: "Unable to load dashboard data" }, 500);
  }
}
