import { notFound } from "next/navigation";
import MicroLearning from "../../../MicroLearning";

export default async function LearningTipPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^\d+$/.test(id) || !Number.isSafeInteger(Number(id)) || Number(id) < 1) notFound();
  return <MicroLearning tipId={Number(id)} />;
}
