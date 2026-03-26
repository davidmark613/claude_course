'use client';

import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth-client';

export default function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await authClient.signOut();
    router.refresh(); // invalidates the server component cache, re-runs getCurrentUser()
    router.push('/authenticate');
  }

  return (
    <button
      onClick={handleLogout}
      className='rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium transition-colors hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-800'
    >
      Log out
    </button>
  );
}
