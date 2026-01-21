"use client";

import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { useSession } from "@/src/lib/auth-client";
import * as Dialog from "@radix-ui/react-dialog";
import { format, setHours, setMinutes, subDays } from "date-fns";
import { fr } from "date-fns/locale";
import { Calendar, Car, Clock, MapPin } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface Rental {
  id: string;
  carId: string;
  car: {
    id: string;
    name: string;
    description: string | null;
    image: string | null;
  };
  start: string;
  end: string;
  paymentStatus: string;
  depositPaid: boolean;
  depositAmount: number;
  remainingAmount: number | null;
  createdAt: string;
}

export default function MyRentalsPage() {
  const { data: session } = useSession();
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalRental, setModalRental] = useState<Rental | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    if (session?.user) {
      fetchRentals();
    }
  }, [session]);

  const fetchRentals = async () => {
    try {
      const response = await fetch("/api/clients/my-rentals");
      if (!response.ok) {
        throw new Error("Failed to fetch rentals");
      }
      const data = await response.json();
      setRentals(data.rentals);
    } catch (error) {
      console.error("Error fetching rentals:", error);
      toast.error("Erreur lors du chargement des locations");
    } finally {
      setIsLoading(false);
    }
  };

  const getPaymentStatusBadge = (paymentStatus: string) => {
    switch (paymentStatus) {
      case "pending_deposit":
        return <Badge variant="destructive">Acompte en attente</Badge>;
      case "deposit_paid":
        return <Badge variant="secondary">Acompte payé</Badge>;
      case "fully_paid":
        return (
          <Badge variant="default" className="bg-green-500">
            Entièrement payé
          </Badge>
        );
      case "cancelled":
        return <Badge variant="outline">Annulé</Badge>;
      default:
        return <Badge variant="outline">{paymentStatus}</Badge>;
    }
  };

  const getRentalStatus = (start: string, paymentStatus: string) => {
    const now = new Date();
    const startDate = new Date(start);

    if (paymentStatus === "cancelled") return "cancelled";
    if (startDate > now) return "upcoming";
    if (
      startDate <= now &&
      new Date(startDate.getTime() + 24 * 60 * 60 * 1000) > now
    )
      return "active";
    return "completed";
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "upcoming":
        return <Badge variant="secondary">À venir</Badge>;
      case "active":
        return (
          <Badge variant="default" className="bg-green-500">
            En cours
          </Badge>
        );
      case "completed":
        return <Badge variant="outline">Terminée</Badge>;
      case "cancelled":
        return <Badge variant="destructive">Annulée</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "upcoming":
        return "border-blue-200 bg-blue-50";
      case "active":
        return "border-green-200 bg-green-50";
      case "completed":
        return "border-gray-200 bg-gray-50";
      case "cancelled":
        return "border-red-200 bg-red-50";
      default:
        return "border-gray-200 bg-gray-50";
    }
  };

  const isCancellable = (startTime: string, paymentStatus: string) => {
    if (paymentStatus === "cancelled") return false;
    const departure = new Date(startTime);
    const cancelLimit = setHours(setMinutes(subDays(departure, 1), 0), 17); // veille à 17h00
    return new Date() < cancelLimit;
  };

  const handleCancel = async () => {
    if (!modalRental) return;
    setIsCancelling(true);
    try {
      const response = await fetch(
        `/api/cars/${modalRental.carId}/reservation/${modalRental.id}`,
        {
          method: "DELETE",
        },
      );
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erreur lors de l'annulation");
      }
      toast.success("Location annulée avec succès");
      setModalRental(null);
      fetchRentals();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erreur lors de l'annulation",
      );
    } finally {
      setIsCancelling(false);
    }
  };

  if (!session?.user) {
    return (
      <div className="container mx-auto p-4">
        <div className="max-w-md mx-auto text-center">
          <h1 className="text-2xl font-bold mb-4">Accès requis</h1>
          <p className="text-muted-foreground mb-6">
            Vous devez être connecté pour voir vos locations.
          </p>
          <Button asChild>
            <a href="/auth/signin">Se connecter</a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Vos locations</h1>
        <p className="text-muted-foreground">
          Gérez et suivez toutes vos locations de voitures
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : rentals.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Car className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Aucune location</h3>
            <p className="text-muted-foreground text-center mb-6">
              Vous n&apos;avez pas encore de locations. Commencez par réserver
              une voiture !
            </p>
            <Button asChild>
              <a href="/dashboard/cars">Voir nos voitures</a>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {rentals.map((rental) => {
            const rentalStatus = getRentalStatus(
              rental.start,
              rental.paymentStatus,
            );
            return (
              <Card
                key={rental.id}
                className={`${getStatusColor(rentalStatus)}`}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div>
                        <CardTitle className="text-xl">
                          {rental.car.name}
                        </CardTitle>
                        {rental.car.description && (
                          <p className="text-muted-foreground text-sm mt-1">
                            {rental.car.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      {getStatusBadge(rentalStatus)}
                      {getPaymentStatusBadge(rental.paymentStatus)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Départ :</span>
                        <span>
                          {format(
                            new Date(rental.start),
                            "dd MMMM yyyy 'à' HH:mm",
                            { locale: fr },
                          )}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Retour :</span>
                        <span>
                          {format(
                            new Date(rental.end),
                            "dd MMMM yyyy 'à' HH:mm",
                            { locale: fr },
                          )}
                        </span>
                      </div>
                      {isCancellable(rental.start, rental.paymentStatus) &&
                        rentalStatus === "upcoming" && (
                          <Button
                            variant="destructive"
                            className="mt-2"
                            onClick={() => setModalRental(rental)}
                          >
                            Annuler la location
                          </Button>
                        )}
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Durée :</span>
                        <span>24 heures</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Lieu :</span>
                        <span>Notre agence</span>
                      </div>
                      {rental.paymentStatus === "deposit_paid" &&
                        rental.remainingAmount && (
                          <div className="flex items-center gap-2 text-sm">
                            <span className="font-medium text-green-600">
                              À payer sur place :
                            </span>
                            <span className="font-semibold text-green-600">
                              {rental.remainingAmount} €
                            </span>
                          </div>
                        )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal de confirmation d'annulation */}
      <Dialog.Root
        open={!!modalRental}
        onOpenChange={(open) => !open && setModalRental(null)}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" />
          <Dialog.Content className="fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 max-w-md w-full rounded-xl bg-white p-8 shadow-xl flex flex-col items-center">
            <Card className="w-full border-none shadow-none bg-transparent">
              <CardHeader>
                <CardTitle className="text-center text-xl">
                  Confirmer l&apos;annulation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-center mb-4">
                  Êtes-vous sûr de vouloir annuler cette location&nbsp;?
                </p>
                <div className="flex flex-col gap-2 items-center">
                  <span className="font-medium">{modalRental?.car?.name}</span>
                  <span className="text-sm text-muted-foreground">
                    Départ :{" "}
                    {modalRental &&
                      format(
                        new Date(modalRental.start),
                        "dd MMMM yyyy 'à' HH:mm",
                        { locale: fr },
                      )}
                  </span>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-2">
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={handleCancel}
                  disabled={isCancelling}
                >
                  {isCancelling ? "Annulation..." : "Oui, annuler la location"}
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setModalRental(null)}
                  disabled={isCancelling}
                >
                  Non, garder la location
                </Button>
              </CardFooter>
            </Card>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
