import { getUser } from "@/src/lib/auth-session";
import { HeaderClient } from "./header-client";

export async function Header() {
  const user = await getUser();
  return <HeaderClient user={user || null} />;
}
