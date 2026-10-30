import { Suspense } from "react";
import RecordsPage from "@/features/records/RecordsPage";

export default function Page({ params }: { params: Promise<{ recordId: string }> }) {
  return <Suspense fallback={<RecordsPage loadingDetail />}><RecordDetail params={params} /></Suspense>;
}

async function RecordDetail({ params }: { params: Promise<{ recordId: string }> }) {
  const { recordId } = await params;
  return <RecordsPage key={recordId} recordId={recordId} />;
}
