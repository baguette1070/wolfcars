"use client";

import { Button } from "@/src/components/ui/button";
import { Calendar } from "@/src/components/ui/calendar";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { ScrollAnimation } from "@/src/components/ui/scroll-animation";
import { useSession } from "@/src/lib/auth-client";
import { addMonths, format, subMonths } from "date-fns";
import { fr } from "date-fns/locale";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

// Fonction pour déterminer le prix selon la voiture
const getCarPrice = (carId: string): number => {
  // RS3 2025 FaceLift
  if (carId === "e421dd5a-ed6b-49fd-9279-9068d1a1291c") {
    return 400;
  }
  // Golf 8 GTI 2020
  if (carId === "e7cddf33-0de4-427d-b0bc-57bdcc1ac680") {
    return 250;
  }
  // Prix par défaut
  return 250;
};

function CarReservationPageWrapper({ carId }: { carId: string }) {
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [carName, setCarName] = useState<string>("");
  const [availableDays, setAvailableDays] = useState<string[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPhoneModalOpen, setIsPhoneModalOpen] = useState(false);
  const [phone, setPhone] = useState("");
  const [userHasPhone, setUserHasPhone] = useState<boolean | null>(null);
  const [availabilityInfo, setAvailabilityInfo] = useState<{
    isAvailable: boolean;
    departureTime: string;
    returnTime: string;
    message: string;
  } | null>(null);

  const { data: session } = useSession();

  // Vérifier si l'utilisateur a un numéro de téléphone
  useEffect(() => {
    const checkUserPhone = async () => {
      if (session?.user) {
        try {
          const response = await fetch("/api/auth/update-phone", {
            method: "GET",
          });
          if (response.ok) {
            const data = await response.json();
            setUserHasPhone(!!data.phone);
          }
        } catch {
          console.error("Error checking phone");
          setUserHasPhone(false);
        }
      }
    };

    checkUserPhone();
  }, [session]);

  // Fonction pour récupérer les jours disponibles pour le mois actuel
  const fetchAvailableDays = useCallback(
    async (month: Date) => {
      try {
        const monthString = format(month, "yyyy-MM");
        const response = await fetch(
          `/api/cars/${carId}/available-days?month=${monthString}`,
        );

        if (!response.ok) {
          throw new Error("Failed to fetch available days");
        }

        const data = await response.json();
        setAvailableDays(data.availableDays);
      } catch (error) {
        console.error("Error fetching available days:", error);
        toast.error("Failed to fetch available days");
        setAvailableDays([]);
      }
    },
    [carId],
  );

  // Charger les jours disponibles au montage et quand le mois change
  useEffect(() => {
    fetchAvailableDays(currentMonth);

    const fetchCarDetails = async () => {
      try {
        const response = await fetch(`/api/cars/${carId}/details`);
        if (response.ok) {
          const data = await response.json();
          setCarName(data.name);
        }
      } catch (error) {
        console.error("Failed to fetch car name", error);
      }
    };
    fetchCarDetails();
  }, [currentMonth, carId, fetchAvailableDays]);

  // Vérifier la disponibilité quand une date est sélectionnée
  const handleDateSelect = async (date: Date | undefined) => {
    setSelectedDate(date);
    setAvailabilityInfo(null);

    if (!date) {
      return;
    }

    try {
      const response = await fetch(
        `/api/cars/${carId}/reservation?date=${format(date, "yyyy-MM-dd")}`,
      );

      if (!response.ok) {
        throw new Error("Failed to check availability");
      }

      const data = await response.json();
      setAvailabilityInfo(data);
    } catch (error) {
      console.error("Error checking availability:", error);
      toast.error("Failed to check availability");
    }
  };

  // Fonction pour vérifier si une date est disponible
  const isDateAvailable = (date: Date) => {
    const dateString = format(date, "yyyy-MM-dd");
    return availableDays.includes(dateString);
  };

  // Navigation entre les mois
  const goToPreviousMonth = () => {
    setCurrentMonth((prev) => subMonths(prev, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth((prev) => addMonths(prev, 1));
  };

  const handleConfirmReservation = async () => {
    if (!selectedDate) return;

    try {
      const response = await fetch("/api/payments/create-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          carId: carId,
          startDate: format(selectedDate, "yyyy-MM-dd"),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(
          data.error?.message || "Erreur lors de la création du paiement",
        );
      }

      window.location.href = data.url;
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Erreur lors de la création de la réservation",
      );
      setIsModalOpen(false);
    }
  };

  const handleAddPhone = async () => {
    if (!phone.trim()) {
      toast.error("Veuillez entrer un numéro de téléphone");
      return;
    }

    try {
      const response = await fetch("/api/auth/update-phone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });

      if (response.ok) {
        toast.success("Numéro de téléphone ajouté avec succès");
        setUserHasPhone(true);
        setIsPhoneModalOpen(false);
        setPhone("");
      } else {
        const error = await response.json();
        toast.error(
          error.error || "Erreur lors de l'ajout du numéro de téléphone",
        );
      }
    } catch {
      toast.error("Erreur lors de l'ajout du numéro de téléphone");
    }
  };

  const handleReservationClick = () => {
    if (userHasPhone === false) {
      setIsPhoneModalOpen(true);
    } else {
      setIsModalOpen(true);
    }
  };

  return (
    <>
      {session?.user ? (
        <div className="container mx-auto p-4">
          <h1 className="text-2xl font-bold mb-6">Louer une voiture</h1>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Calendrier */}
            <Card>
              <CardHeader>
                <CardTitle>Choisissez une date de départ</CardTitle>
                <div className="flex items-center justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToPreviousMonth}
                  >
                    ← Précédent
                  </Button>
                  <span className="text-sm font-medium">
                    {format(currentMonth, "MMMM yyyy", { locale: fr })}
                  </span>
                  <Button variant="outline" size="sm" onClick={goToNextMonth}>
                    Suivant →
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleDateSelect}
                  locale={fr}
                  month={currentMonth}
                  onMonthChange={setCurrentMonth}
                  disabled={(date) => {
                    // Désactiver les weekends
                    const isWeekend =
                      date.getDay() === 0 || date.getDay() === 6;
                    // Désactiver les jours passés
                    const isPast = date < new Date();
                    // Désactiver les jours non disponibles
                    const isNotAvailable = !isDateAvailable(date);

                    return isWeekend || isPast || isNotAvailable;
                  }}
                  className="rounded-md border"
                />
                <div className="mt-4 text-sm text-muted-foreground">
                  <p>• Jours en gris : Voiture déjà louée</p>
                  <p>• Jours en blanc : Disponible pour location</p>
                </div>
              </CardContent>
            </Card>

            {/* Informations de location */}
            <Card>
              <CardHeader>
                <CardTitle>
                  {selectedDate
                    ? `Détails de la location pour le ${format(selectedDate, "dd MMMM yyyy", { locale: fr })}`
                    : "Sélectionnez une date pour voir les détails"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedDate && availabilityInfo ? (
                  <div className="space-y-4">
                    <ScrollAnimation direction="down" delay={0.2}>
                      <div
                        className={`p-4 rounded-lg ${availabilityInfo.isAvailable ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}
                      >
                        <p
                          className={`font-medium ${availabilityInfo.isAvailable ? "text-green-800" : "text-red-800"}`}
                        >
                          {availabilityInfo.message}
                        </p>
                      </div>
                    </ScrollAnimation>

                    {availabilityInfo.isAvailable && (
                      <ScrollAnimation direction="down" delay={0.2}>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                            <span className="font-medium">Départ :</span>
                            <span>
                              {format(
                                new Date(availabilityInfo.departureTime),
                                "dd/MM/yyyy à HH:mm",
                                { locale: fr },
                              )}
                            </span>
                          </div>

                          <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                            <span className="font-medium">Retour :</span>
                            <span>
                              {format(
                                new Date(availabilityInfo.returnTime),
                                "dd/MM/yyyy à HH:mm",
                                { locale: fr },
                              )}
                            </span>
                          </div>

                          <div className="text-sm text-muted-foreground text-center">
                            <p>Durée : 24 heures</p>
                            <p>Heure de départ : 9h00</p>
                            <p>Heure de retour : 8h45 (le lendemain)</p>
                          </div>
                        </div>
                      </ScrollAnimation>
                    )}

                    {availabilityInfo.isAvailable && (
                      <ScrollAnimation direction="down" delay={0.2}>
                        <Button
                          className="w-full"
                          onClick={handleReservationClick}
                          disabled={userHasPhone === null}
                        >
                          {userHasPhone === null
                            ? "Chargement..."
                            : userHasPhone
                              ? "Confirmer la location"
                              : "Ajouter votre numéro de téléphone pour réserver"}
                        </Button>
                      </ScrollAnimation>
                    )}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    Veuillez d&apos;abord sélectionner une date
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Modal de confirmation de réservation */}
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Confirmer votre location</DialogTitle>
                <DialogDescription>
                  Votre réservation sera confirmée après le paiement de
                  l&apos;acompte. Vous devez payer 0,50 euros d&apos;acompte dès
                  maintenant via Stripe. Le montant restant de{" "}
                  {getCarPrice(carId) - 0.5} € sera à payer sur place lors de la
                  récupération du véhicule.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="flex justify-between items-center p-3 bg-gray-100 rounded-lg">
                  <span className="font-medium">Voiture :</span>
                  <span className="font-semibold">{carName}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-100 rounded-lg">
                  <span className="font-medium">Date :</span>
                  <span className="font-semibold">
                    {selectedDate ? format(selectedDate, "dd/MM/yyyy") : ""}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-100 rounded-lg">
                  <span className="font-medium">Acompte :</span>
                  <span className="font-semibold">0,50 €</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-100 rounded-lg">
                  <span className="font-medium">Montant restant :</span>
                  <span className="font-semibold">
                    {getCarPrice(carId) - 0.5} €
                  </span>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Important :</strong> N&apos;oubliez pas
                    d&apos;apporter votre permis de conduire et une pièce
                    d&apos;identité lors de la récupération du véhicule.
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                  Annuler
                </Button>
                <Button onClick={handleConfirmReservation}>
                  Payer l&apos;acompte
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Modal pour ajouter le numéro de téléphone */}
          <Dialog open={isPhoneModalOpen} onOpenChange={setIsPhoneModalOpen}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Ajouter votre numéro de téléphone</DialogTitle>
                <DialogDescription>
                  Un numéro de téléphone est requis pour effectuer une
                  réservation. Nous l&apos;utiliserons pour vous contacter en
                  cas de besoin.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid gap-3">
                  <Label htmlFor="phone">Numéro de téléphone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+32 4XX XX XX XX"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsPhoneModalOpen(false)}
                >
                  Annuler
                </Button>
                <Button onClick={handleAddPhone}>Ajouter le numéro</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      ) : (
        <div className="container mx-auto p-4">
          <div className="max-w-md mx-auto text-center">
            <h1 className="text-2xl font-bold mb-4">Accès requis</h1>
            <p className="text-muted-foreground mb-6">
              Vous devez être connecté pour réserver une voiture.
            </p>
            <Button asChild>
              <a href="/auth/signin">Se connecter</a>
            </Button>
          </div>
        </div>
      )}
    </>
  );
}

export default async function CarReservationPage({
  params,
}: {
  params: Promise<{ carId: string }>;
}) {
  const { carId } = await params;
  return <CarReservationPageWrapper carId={carId} />;
}
