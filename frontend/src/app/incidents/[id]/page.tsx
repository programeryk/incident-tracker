import { IncidentDetail } from '@/features/incidents/IncidentDetail';

type IncidentDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function IncidentDetailPage({
  params,
}: IncidentDetailPageProps) {
  const { id } = await params;

  return <IncidentDetail incidentId={id} />;
}
