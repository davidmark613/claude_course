import { betterAuth } from 'better-auth';
import { nextCookies } from 'better-auth/next-js';
import { headers } from 'next/headers';
import { getDb } from '@/lib/db';

export const auth = betterAuth({
  database: getDb(),
  emailAndPassword: {
    enabled: true,
  },
  trustedOrigins: [process.env.BETTER_AUTH_URL ?? 'http://localhost:3000'],
  plugins: [nextCookies()],
});

export async function getCurrentUser() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  return session?.user ?? null;
}

export async function getSession() {
  return auth.api.getSession({
    headers: await headers(),
  });
}
