import { redirect } from "next/navigation";
import { getSession, homeFor } from "@/lib/auth/session";

export default async function Index() {
  const session = await getSession();
  redirect(homeFor(session));
}
