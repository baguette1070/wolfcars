"use client";

import { Button } from "@/src/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { useRouter } from "next/navigation";

export default function PaymentCancelledPage() {
  const router = useRouter();

  const handleTryAgain = () => {
    router.back();
  };

  const handleGoHome = () => {
    router.push("/");
  };

  return (
    <div className="container mx-auto p-4 min-h-screen flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <CardTitle className="text-2xl text-red-600">
            Paiement annulé
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center space-y-2">
            <p className="text-lg font-medium">Votre paiement a été annulé</p>
            <p className="text-sm text-muted-foreground">
              Vous pouvez réessayer de réserver votre véhicule en cliquant sur
              le bouton ci-dessous.
            </p>
          </div>

          <div className="bg-yellow-50 p-4 rounded-lg">
            <h3 className="font-medium text-yellow-900 mb-2">
              Que s&apos;est-il passé ?
            </h3>
            <ul className="text-sm text-yellow-800 space-y-1">
              <li>• Vous avez fermé la fenêtre de paiement</li>
              <li>• Vous avez cliqué sur &quot;Annuler&quot;</li>
              <li>• Une erreur s&apos;est produite pendant le paiement</li>
            </ul>
          </div>

          <div className="flex flex-col space-y-2">
            <Button onClick={handleTryAgain} className="w-full">
              Réessayer la réservation
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
