import { PageTransition } from '@/components/motion';

export default function MainTemplate({ children }: { children: React.ReactNode }) {
  return <PageTransition className="flex flex-1 flex-col">{children}</PageTransition>;
}
