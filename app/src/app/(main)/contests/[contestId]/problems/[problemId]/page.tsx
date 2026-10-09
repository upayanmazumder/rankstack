import { ProblemWorkspace } from '@/components/problems';

interface ProblemPageProps {
  params: Promise<{ contestId: string; problemId: string }>;
}

export default async function ProblemPage({ params }: ProblemPageProps) {
  const { contestId, problemId } = await params;

  return <ProblemWorkspace contestId={contestId} problemId={problemId} />;
}
