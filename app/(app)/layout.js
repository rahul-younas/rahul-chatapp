import { getAuthUser } from "@/lib/auth";
import { Navbar } from "@/components/layout/navbar";

export default async function AppLayout({ children }) {
  const user = await getAuthUser();

  return (
    <>
      <Navbar isAdmin={user?.role === "admin"} />
      <main className="flex-1">{children}</main>
    </>
  );
}
