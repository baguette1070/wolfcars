// app/components/AuthButtons.tsx
"use client";

import { Button } from "@/src/components/ui/button";
import { redirect } from "next/navigation";
import { signOut } from "./actions";

export default function AuthButtons() {
  const handleGoToDashboard = () => {
    redirect("/");
  };

  return (
    <div className="flex flex-col gap-4">
      <form action={signOut}>
        <Button variant="outline" type="submit" className="text-sm">
          Se déconnecter
        </Button>
      </form>
      <Button
        variant="default"
        onClick={handleGoToDashboard}
        className="bg-black text-white text-sm hover:bg-gray-800"
      >
        Aller au menu
      </Button>
    </div>
  );
}
