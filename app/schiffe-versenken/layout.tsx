import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

export default async function SchiffeVersenkenLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden">
      {children}
    </div>
  );
}
