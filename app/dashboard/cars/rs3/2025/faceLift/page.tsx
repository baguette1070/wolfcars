import rs3Derriere2 from "@/src/assets/rs3-2025-faceLift/background/rs3-2025-faceLift-arriere2.png";
import rs3Derriere from "@/src/assets/rs3-2025-faceLift/background/rs3-2025-faceLift-derriere.png";
import rs3Roue from "@/src/assets/rs3-2025-faceLift/background/rs3-2025-faceLift-roue.png";
import rs3SiegeArriere from "@/src/assets/rs3-2025-faceLift/background/rs3-2025-faceLift-siegeArriere.png";
import rs3SiegeAvant from "@/src/assets/rs3-2025-faceLift/background/rs3-2025-faceLift-siegeAvant.png";
import rs3Volant from "@/src/assets/rs3-2025-faceLift/background/rs3-2025-faceLift-volant.png";
import rs3Volant2 from "@/src/assets/rs3-2025-faceLift/background/rs3-2025-faceLift-volant2.png";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { getUser } from "@/src/lib/auth-session";
import { StaticImageData } from "next/image";
import Link from "next/link";
import Carousel from "./Carousel";

const images: StaticImageData[] = [
  rs3Volant,
  rs3Volant2,
  rs3Derriere,
  rs3Derriere2,
  rs3Roue,
  rs3SiegeAvant,
  rs3SiegeArriere,
];

export default async function RS3Page() {
  const user = await getUser();

  return (
    <section className="min-h-screen flex flex-col items-center justify-center w-full max-w-6xl mx-auto py-12 px-4">
      <div className="w-full mb-8">
        <h1 className="text-3xl font-bold text-center mb-2">
          Audi RS3 2025 (FaceLift)
        </h1>
        <p className="text-muted-foreground text-center">
          La performance pure dans sa forme la plus raffinée
        </p>
      </div>

      <div className="flex justify-center w-full items-center h-[600px] mb-8">
        <Carousel images={images} />
      </div>

      <div className="flex justify-center w-1/2">
        {/* Caractéristiques techniques */}
        <Card>
          <CardHeader>
            <CardTitle className="text-center">
              Caractéristiques techniques
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-semibold">Moteur :</span> 2.5L TFSI 5
                cylindres
              </div>
              <div>
                <span className="font-semibold">Puissance :</span> 400 ch
              </div>
              <div>
                <span className="font-semibold">0-100 km/h :</span> 3.8s
              </div>
              <div>
                <span className="font-semibold">Transmission :</span> Quattro
              </div>
            </div>

            <div className="pt-4">
              <p className="text-muted-foreground text-center">
                Découvrez la puissance brute et la technologie de pointe de
                l&apos;Audi RS3 2025. Réservez votre essai dès maintenant pour
                vivre l&apos;expérience.
              </p>
            </div>
          </CardContent>
          <CardFooter>
            <Link
              className="w-full"
              href={
                user
                  ? `/dashboard/cars/e421dd5a-ed6b-49fd-9279-9068d1a1291c/reservation`
                  : "/auth/signin"
              }
            >
              <button
                type={user ? "submit" : "button"}
                className="mt-4 px-4 py-2 w-full rounded bg-primary text-white font-medium hover:bg-primary/90 transition-colors cursor-pointer"
              >
                {user ? "Réserver" : "Connectez-vous pour reserver"}
              </button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    </section>
  );
}
