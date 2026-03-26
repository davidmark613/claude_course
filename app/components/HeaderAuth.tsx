'use client';

import { authClient } from '@/lib/auth-client';
import LogoutButton from './LogoutButton';

export default function HeaderAuth() {
  const { data: session, isPending } = authClient.useSession();

  if (isPending || !session) return null;

  return <LogoutButton />;
}
