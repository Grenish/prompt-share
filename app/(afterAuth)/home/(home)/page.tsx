import { createClient } from "@/util/supabase/server";
import { redirect } from "next/navigation";
import { normalizeUser } from "@/lib/normalizeUser";

export default async function DashboardHomePage() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    redirect("/login");
  }

  const user = normalizeUser(data.user);

  return (
    <div className="">
      <h2>Hello {user?.displayName}</h2>
    </div>
  );
}
