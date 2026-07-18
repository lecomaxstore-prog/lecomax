import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error("Supabase service configuration is missing.");

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const [{ data: transactions, error: transactionError }, { data: balances, error: balanceError }] = await Promise.all([
  supabase.from("loyalty_transactions").select("status,points"),
  supabase.from("user_points").select("points"),
]);
if (transactionError) throw transactionError;
if (balanceError) throw balanceError;

const byStatus = (transactions ?? []).reduce((summary, transaction) => {
  const status = String(transaction.status || "unknown");
  summary[status] ??= { transactions: 0, points: 0 };
  summary[status].transactions += 1;
  summary[status].points += Number(transaction.points) || 0;
  return summary;
}, {});

console.log(JSON.stringify({
  by_status: byStatus,
  accounts_with_points: (balances ?? []).filter((row) => Number(row.points) > 0).length,
  total_available_points: (balances ?? []).reduce((sum, row) => sum + (Number(row.points) || 0), 0),
}, null, 2));
