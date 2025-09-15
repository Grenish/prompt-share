import type { User } from "@supabase/supabase-js";

export type NormalizedUser = {
  id: string;
  displayName: string;
  email: string;
  avatarUrl: string | null;
};

export function normalizeUser(user: User | null): NormalizedUser | null {
  if (!user) return null;

  return {
    id: user.id,
    displayName: user.user_metadata.display_name,
    email: user.email ?? '',
    avatarUrl:
      user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
  };
}
