"use client";

import { Button } from "@/src/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { CheckCircle, XCircle } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const [verificationStatus, setVerificationStatus] = useState<
    "loading" | "success" | "error"
  >("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get("token");

      if (!token) {
        setVerificationStatus("error");
        setMessage("Lien de vérification invalide");
        return;
      }

      try {
        const response = await fetch("/api/auth/verify-email", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token }),
        });

        if (response.ok) {
          setVerificationStatus("success");
          setMessage("Votre adresse email a été vérifiée avec succès !");
          toast.success("Email vérifié avec succès");
        } else {
          const data = await response.json();
          setVerificationStatus("error");
          setMessage(data.error || "Erreur lors de la vérification");
          toast.error(data.error || "Erreur lors de la vérification");
        }
      } catch {
        setVerificationStatus("error");
        setMessage("Erreur lors de la vérification");
        toast.error("Erreur lors de la vérification");
      }
    };

    verifyEmail();
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {verificationStatus === "loading" && (
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            )}
            {verificationStatus === "success" && (
              <CheckCircle className="h-12 w-12 text-green-600" />
            )}
            {verificationStatus === "error" && (
              <XCircle className="h-12 w-12 text-red-600" />
            )}
          </div>
          <CardTitle>
            {verificationStatus === "loading" && "Vérification en cours..."}
            {verificationStatus === "success" && "Email vérifié !"}
            {verificationStatus === "error" && "Erreur de vérification"}
          </CardTitle>
          <CardDescription>
            {verificationStatus === "loading" &&
              "Veuillez patienter pendant que nous vérifions votre email..."}
            {verificationStatus === "success" &&
              "Votre compte est maintenant actif et vous pouvez vous connecter."}
            {verificationStatus === "error" &&
              "Impossible de vérifier votre email. Veuillez réessayer."}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          {message && (
            <p className="mb-4 text-sm text-muted-foreground">{message}</p>
          )}

          {verificationStatus === "success" && (
            <Button asChild className="w-full">
              <a href="/auth/signin">Se connecter</a>
            </Button>
          )}

          {verificationStatus === "error" && (
            <div className="space-y-2">
              <Button asChild variant="outline" className="w-full">
                <a href="/auth/signin">Retour à la connexion</a>
              </Button>
              <p className="text-xs text-muted-foreground">
                Si le problème persiste, contactez notre support.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
