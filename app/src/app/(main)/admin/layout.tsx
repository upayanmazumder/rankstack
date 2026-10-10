import { AdminGuard } from '@/components/admin';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  return <AdminGuard>{children}</AdminGuard>;
}
