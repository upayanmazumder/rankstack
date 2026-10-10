import { ProblemWorkspace } from '@/components/problems';

interface ProblemPageProps {
  params: Promise<{ id: string; problemId: string }>;
}

export default async function ProblemPage({ params }: ProblemPageProps) {
  const { id, problemId } = await params;

  return <ProblemWorkspace contestId={id} problemId={problemId} />;
}
