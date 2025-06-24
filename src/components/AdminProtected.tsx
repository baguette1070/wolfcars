"use client";

import { useSession } from "@/src/lib/auth-client";
import { redirect } from "next/navigation";
import { ReactNode } from "react";

interface AdminProtectedProps {
  children: ReactNode;
}

export default function AdminProtected({ children }: AdminProtectedProps) {
  const { data: session, isPending } = useSession();

  if (isPending) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!session?.user) {
    redirect("/auth/signin");
  }

  // Vérifier le rôle admin depuis la session
  // Note: Nous devrons récupérer le rôle depuis la base de données
  // Pour l'instant, nous utiliserons une vérification temporaire
  const isAdmin = session.user.email === "lamrininawfal11@gmail.com";

  if (!isAdmin) {
    redirect("/dashboard");
  }

  return <>{children}</>;
}
