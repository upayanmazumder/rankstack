import { TeamProfile } from '@/components/teams';

interface TeamPageProps {
  params: Promise<{ id: string }>;
}

export default async function TeamPage({ params }: TeamPageProps) {
  const { id } = await params;
  return <TeamProfile teamId={id} />;
}
