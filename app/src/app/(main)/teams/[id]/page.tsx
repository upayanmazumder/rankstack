import { TeamProfile } from '@/components/teams';

export default async function TeamPage({ params }: PageProps<'/teams/[id]'>) {
  const { id } = await params;
  return <TeamProfile teamId={id} />;
}
