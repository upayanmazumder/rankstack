import { useAuthStore } from '@/stores';

import { useMounted } from './use-mounted';

export function useHydratedUser() {
  const mounted = useMounted();
  const user = useAuthStore(state => state.user);

  return mounted ? user : null;
}
