import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL is not defined");
}

let adminClient: ReturnType<typeof createClient> | null = null;

export function getAdminClient() {
  if (!serviceKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured on the server");
  }

  const key = serviceKey as string;

  if (!adminClient) {
    adminClient = createClient(url as string, key, {
      auth: {
        persistSession: false,
      },
    });
  }

  return adminClient;
}
