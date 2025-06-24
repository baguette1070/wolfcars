import golf8 from "@/src/assets/golf8-2020-gti/background/image.png";
import rs3Derriere from "@/src/assets/rs3-2025-faceLift/background/rs3-2025-faceLift-derriere.png";
import { ScrollAnimation } from "@/src/components/ui/scroll-animation";
import Image from "next/image";
import Link from "next/link";

export default async function CarsPage() {
  return (
    <section className="min-h-[70vh] h-screen flex flex-col items-center justify-center w-full max-w-7xl mx-auto pb-20">
      <ScrollAnimation direction="down" delay={0.5}>
        <h2 className="text-4xl font-bold mb-6 text-center font-serif">
          <i>Nos voitures</i>
        </h2>
      </ScrollAnimation>
      <div className="grid md:grid-cols-2 gap-20 pt-10">
        {/* RS3 */}
        <ScrollAnimation direction="right" delay={0.5}>
          <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center h-full">
            <div className="flex-1 w-full flex flex-col items-center">
              <div className="flex gap-2 mb-4">
                <Image
                  src={rs3Derriere}
                  alt="Audi RS3 arrière"
                  width={120}
                  height={80}
                  className="rounded object-cover"
                />
              </div>
              <h3 className="text-xl font-semibold mb-2">
                Audi RS3 2025 (FaceLift)
              </h3>
              <p className="text-gray-600 text-sm mb-2 text-center">
                2.5L TFSI 5 cylindres, 400ch, 0-100km/h en 3.8s.
                <br />
                Transmission Quattro, intérieur sport, dernières technologies
                Audi.
              </p>
            </div>
            <div className="w-full flex justify-center mt-4">
              <Link href="/dashboard/cars/rs3/2025/faceLift">
                <button className="px-4 py-2 rounded bg-primary text-white font-medium hover:bg-primary/90 transition-colors mt-2 cursor-pointer">
                  Réserver la voiture
                </button>
              </Link>
            </div>
          </div>
        </ScrollAnimation>

        {/* Golf 8 GTI */}
        <ScrollAnimation direction="left" delay={0.5}>
          <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center h-full">
            <div className="flex-1 w-full flex flex-col items-center">
              <div className="mb-4">
                <Image
                  src={golf8}
                  alt="Golf 8 GTI"
                  width={180}
                  height={100}
                  className="rounded object-cover"
                />
              </div>
              <h3 className="text-xl font-semibold mb-2">
                Volkswagen Golf 8 GTI
              </h3>
              <p className="text-gray-600 text-sm mb-2 text-center">
                2.0L TSI, 245ch, 0-100km/h en 6.2s.
                <br />
                Polyvalente, sportive et confortable, idéale pour tous vos
                trajets.
              </p>
            </div>
            <div className="w-full flex justify-center mt-4">
              <Link href="/dashboard/cars/golf8/2020/gti">
                <button className="px-4 py-2 rounded bg-primary text-white font-medium hover:bg-primary/90 transition-colors mt-2 cursor-pointer">
                  Réserver la voiture
                </button>
              </Link>
            </div>
          </div>
        </ScrollAnimation>
      </div>
    </section>
  );
}
