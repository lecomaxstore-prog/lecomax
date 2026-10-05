import TrackingClient from "./TrackingClient";

export default async function TrackingPage({ searchParams }: {
  searchParams: Promise<{ order?: string | string[] }>;
}) {
  const { order } = await searchParams;
  const value = typeof order === "string" ? order.trim().toUpperCase() : "";
  const initialOrder = /^(?:#?ECO-?\d{6}|#?\d{6})$/.test(value) ? value : "";
  return <TrackingClient initialOrder={initialOrder} />;
}
