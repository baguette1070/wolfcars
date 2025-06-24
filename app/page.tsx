import { Button } from "@/src/components/ui/button";
import { ScrollAnimation } from "@/src/components/ui/scroll-animation";
import { getUser } from "@/src/lib/auth-session";
import Link from "next/link";

export default async function Home() {
  const user = await getUser();

  return (
    <>
      <ScrollAnimation direction="down" delay={0.5}>
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-8 p-4">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-2">
              Bienvenue sur votre espace de gestion
            </h1>
            <p className="text-lg text-muted-foreground mb-4">
              {user ? `Connecté en tant que : ${user.email}` : ""}
            </p>
            <p className="text-base text-gray-500">
              Ici, vous pourrez gérer vos voitures, vos réservations et vos
              clients.
            </p>
          </div>
          <Link href={"/dashboard/cars"}>
            <Button
              size="lg"
              className="bg-primary text-white hover:bg-primary/90"
            >
              Voir nos voitures
            </Button>
          </Link>
        </div>
      </ScrollAnimation>

      <ScrollAnimation direction="up" delay={1.0}>
        {/* Qui sommes-nous ? */}
        <section className="w-full max-w-3xl mx-auto mt-20 px-4 pb-40">
          <h2 className="text-2xl font-bold mb-4 text-center">
            Qui sommes-nous ?
          </h2>
          <p className="text-base text-gray-700 text-center">
            Nous sommes une équipe passionnée par l&apos;automobile et la
            mobilité, spécialisée dans la
            <Link
              href="/dashboard/cars"
              className="font-bold text-primary hover:underline mx-1"
            >
              location de voitures
            </Link>
            <span className="font-bold text-primary">haut de gamme</span> et
            <span className="font-bold text-primary mx-1">sportives</span>.
            <br />
            Notre mission est de rendre l&apos;expérience de location simple,
            rapide et agréable, que ce soit pour un déplacement professionnel,
            un week-end ou un événement spécial.
            <br />
            <br />
            Notre plateforme vous permet de gérer facilement vos réservations,
            d&apos;
            <Link
              href="/dashboard/cars"
              className="font-bold text-primary hover:underline mx-1"
            >
              ajouter ou retirer des véhicules
            </Link>
            , et de suivre l&apos;historique de vos locations en toute sécurité.
            <br />
            <br />
          </p>
        </section>
      </ScrollAnimation>
    </>
  );
}
