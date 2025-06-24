"use client";

import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { authClient } from "@/src/lib/auth-client";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

export default function ForgetPassword() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const router = useRouter();

  if (!token) {
    return (
      <div className="max-w-md mx-auto w-full p-4">
        <h1 className="text-2xl font-bold mb-4">Réinitialiser mot de passe</h1>
        <p className="text-sm text-gray-500 mb-4">
          Veuillez entrer votre email pour réinitialiser votre mot de passe.
        </p>
        <form
          action={async (formData: FormData) => {
            const email = formData.get("email");
            const toastId = toast.loading("Envoi du lien en cours...");
            await authClient.forgetPassword(
              {
                email: email as string,
                redirectTo: "/auth/forget-password",
              },
              {
                onResponse: () => {
                  toast.dismiss(toastId);
                  toast.success("Lien envoyé avec succès");
                },
                onError: (ctx) => {
                  toast.dismiss(toastId);
                  toast.error(
                    ctx.error.message || "Erreur lors de l'envoi du mail"
                  );
                },
              }
            );
          }}
          className="flex gap-2"
        >
          <Input
            id="email"
            type="email"
            name="email"
            placeholder="Email"
            className="w-full"
            required
          />
          <Button type="submit">Envoyer le lien</Button>
        </form>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto w-full p-4">
      <h1 className="text-2xl font-bold mb-4">Réinitialiser mot de passe</h1>
      <p className="text-sm text-gray-500 mb-4">
        Veuillez entrer votre mot de passe.
      </p>
      <form
        action={async (formData: FormData) => {
          const password = formData.get("password");
          await authClient.resetPassword(
            {
              newPassword: password as string,
              token: token as string,
            },
            {
              onError: (ctx) => {
                toast.error(ctx.error.message);
              },
              onSuccess: () => {
                toast.success("Mot de passe réinitialisé avec succès");
                router.push("/auth/signin");
              },
            }
          );
        }}
        className="flex gap-2"
      >
        <Input
          id="password"
          type="password"
          name="password"
          placeholder="Mot de passe"
          className="w-full"
          required
        />
        <Button type="submit">Réinitialiser mot de passe</Button>
      </form>
    </div>
  );
}
