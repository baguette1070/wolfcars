"use client";

import AdminProtected from "@/src/components/AdminProtected";
import { Button } from "@/src/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface Reservation {
  id: string;
  start: string;
  end: string;
  isBooked: boolean;
  bookedBy: string | null;
  car: {
    id: string;
    name: string;
  };
  user?: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
  };
}

export default function AdminReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchReservations();
  }, []);

  const fetchReservations = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/reservations");
      if (response.ok) {
        const data = await response.json();
        // Filtrer pour ne garder que les réservations actives
        const activeReservations = data.reservations.filter(
          (reservation: Reservation) => reservation.isBooked && reservation.user
        );
        setReservations(activeReservations);
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des réservations:", error);
      toast.error("Erreur lors de la récupération des réservations");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReservation = async (
    reservationId: string,
    userEmail: string,
    carName: string,
    startDate: string
  ) => {
    setDeletingId(reservationId);
    try {
      const response = await fetch(`/api/admin/reservations/${reservationId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userEmail,
          carName,
          startDate,
        }),
      });

      if (response.ok) {
        toast.success("Location retirée avec succès. Email envoyé au client.");
        // Recharger les réservations
        fetchReservations();
      } else {
        const error = await response.json();
        toast.error(error.error || "Erreur lors de la suppression");
      }
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur lors de la suppression");
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <AdminProtected>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
        </div>
      </AdminProtected>
    );
  }

  return (
    <AdminProtected>
      <div className="container mx-auto p-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Gestion des réservations</h1>
          <p className="text-muted-foreground">
            Gérez les réservations actives des clients
          </p>
        </div>

        {reservations.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground text-lg">
              Aucune réservation active pour le moment
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {reservations.map((reservation) => (
              <Card key={reservation.id}>
                <CardHeader>
                  <CardTitle className="flex justify-between items-center">
                    <span>{reservation.car.name}</span>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() =>
                        handleDeleteReservation(
                          reservation.id,
                          reservation.user!.email,
                          reservation.car.name,
                          reservation.start
                        )
                      }
                      disabled={deletingId === reservation.id}
                    >
                      {deletingId === reservation.id
                        ? "Suppression..."
                        : "Retirer la location"}
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Début
                      </p>
                      <p className="font-medium">
                        {format(
                          new Date(reservation.start),
                          "dd/MM/yyyy à HH:mm",
                          { locale: fr }
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Fin
                      </p>
                      <p className="font-medium">
                        {format(
                          new Date(reservation.end),
                          "dd/MM/yyyy à HH:mm",
                          { locale: fr }
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Client
                      </p>
                      <p className="font-medium">{reservation.user?.name}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Email
                      </p>
                      <p className="font-medium">{reservation.user?.email}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Téléphone
                      </p>
                      <p className="font-medium">
                        {reservation.user?.phone || "Non renseigné"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AdminProtected>
  );
}
