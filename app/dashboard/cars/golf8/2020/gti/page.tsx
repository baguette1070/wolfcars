import golf8Image from "@/src/assets/golf8-2020-gti/background/image.png";
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
import Carousel from "../../../rs3/2025/faceLift/Carousel";

const images: StaticImageData[] = [golf8Image];

export default async function Golf8Page() {
  const user = await getUser();

  return (
    <section className="min-h-screen flex flex-col items-center justify-center w-full max-w-6xl mx-auto py-12 px-4">
      <div className="w-full mb-8">
        <h1 className="text-3xl font-bold text-center mb-2">
          Volkswagen Golf 8 GTI 2020
        </h1>
        <p className="text-muted-foreground text-center">
          L&apos;icône sportive compacte, alliance de performance et de
          polyvalence
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
                <span className="font-semibold">Moteur :</span> 2.0L TSI 4
                cylindres
              </div>
              <div>
                <span className="font-semibold">Puissance :</span> 245 ch
              </div>
              <div>
                <span className="font-semibold">0-100 km/h :</span> 6.2s
              </div>
              <div>
                <span className="font-semibold">Transmission :</span> Traction
                avant
              </div>
            </div>

            <div className="pt-4">
              <p className="text-muted-foreground text-center">
                Découvrez le plaisir de conduite et la polyvalence de la Golf 8
                GTI. Réservez votre essai dès maintenant pour vivre
                l&apos;expérience.
              </p>
            </div>
          </CardContent>
          <CardFooter>
            <Link
              className="w-full"
              href={
                user
                  ? "/dashboard/cars/e7cddf33-0de4-427d-b0bc-57bdcc1ac680/reservation"
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
