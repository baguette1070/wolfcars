"use client";

import { Button } from "@/src/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useSession } from "@/src/lib/auth-client";

export default function PaymentSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const { data: session } = useSession();

  useEffect(() => {
    const sessionId = searchParams.get("session_id");

    if (!sessionId) {
      setIsLoading(false);
      return;
    }

    const verifyPayment = async () => {
      try {
        if (!session?.user?.id) {
          // User not loaded yet; wait for session
          return;
        }

        console.log("Payment successful, session ID:", sessionId);
        const res = await fetch("/api/payment/verify-and-send-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId, userId: session.user.id }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          console.error("Failed to verify payment:", err);
        } else {
          const data = await res.json();
          console.log("Verified payment:", data);
        }
      } catch (e) {
        console.error("Error verifying payment:", e);
      } finally {
        setIsLoading(false);
      }
    };

    verifyPayment();
  }, [searchParams, session?.user?.id]);

  const handleGoToRentals = () => {
    router.push("/dashboard/my-rentals");
  };

  const handleGoHome = () => {
    router.push("/");
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-lg font-medium">
              Traitement de votre paiement...
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Veuillez patienter pendant que nous confirmons votre acompte.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 min-h-screen flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <CardTitle className="text-2xl text-green-600">
            Paiement réussi !
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center space-y-2">
            <p className="text-lg font-medium">
              Votre acompte de 0,50€ a été confirmé
            </p>
            <p className="text-sm text-muted-foreground">
              Votre réservation est maintenant confirmée. Vous recevrez un email
              de confirmation avec tous les détails.
            </p>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-medium text-blue-900 mb-2">
              Prochaines étapes :
            </h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Payez le montant restant sur place</li>
              <li>• Apportez votre permis et une pièce d&apos;identité</li>
              <li>• Présentez-vous à 9h00 le jour du départ</li>
            </ul>
          </div>

          <div className="flex flex-col space-y-2">
            <Button onClick={handleGoToRentals} className="w-full">
              Voir mes locations
            </Button>
            <Button variant="outline" onClick={handleGoHome} className="w-full">
              Retour à l&apos;accueil
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

