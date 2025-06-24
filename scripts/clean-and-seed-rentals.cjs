const { PrismaClient } = require("../src/generated/prisma");
const { addDays, setHours, setMinutes } = require("date-fns");

const prisma = new PrismaClient();

async function cleanAndSeedRentals() {
  try {
    console.log("🧹 Nettoyage des anciennes données...");

    // Supprimer toutes les anciennes réservations
    await prisma.appointmentSlot.deleteMany({});
    console.log("✅ Anciennes réservations supprimées");

    // Récupérer la voiture RS3
    const rs3Car = await prisma.car.findFirst({
      where: {
        name: {
          contains: "RS3",
        },
      },
    });

    if (!rs3Car) {
      console.error("❌ Voiture RS3 non trouvée");
      return;
    }

    console.log(`✅ Voiture trouvée: ${rs3Car.name} (ID: ${rs3Car.id})`);

    // Créer quelques locations de test pour les prochains jours
    const testRentals = [];
    const today = new Date();

    // Location 1: Demain (si c'est un jour ouvré)
    const tomorrow = addDays(today, 1);
    if (tomorrow.getDay() !== 0 && tomorrow.getDay() !== 6) {
      const departure1 = setHours(setMinutes(tomorrow, 0), 9);
      const return1 = addDays(setHours(setMinutes(tomorrow, 45), 8), 1);

      testRentals.push({
        carId: rs3Car.id,
        start: departure1,
        end: return1,
        isBooked: true,
        bookedBy: "test-user-1",
      });
    }

    // Location 2: Dans 3 jours
    const day3 = addDays(today, 3);
    if (day3.getDay() !== 0 && day3.getDay() !== 6) {
      const departure2 = setHours(setMinutes(day3, 0), 9);
      const return2 = addDays(setHours(setMinutes(day3, 45), 8), 1);

      testRentals.push({
        carId: rs3Car.id,
        start: departure2,
        end: return2,
        isBooked: true,
        bookedBy: "test-user-2",
      });
    }

    // Location 3: Dans 5 jours
    const day5 = addDays(today, 5);
    if (day5.getDay() !== 0 && day5.getDay() !== 6) {
      const departure3 = setHours(setMinutes(day5, 0), 9);
      const return3 = addDays(setHours(setMinutes(day5, 45), 8), 1);

      testRentals.push({
        carId: rs3Car.id,
        start: departure3,
        end: return3,
        isBooked: true,
        bookedBy: "test-user-3",
      });
    }

    // Insérer les locations de test
    if (testRentals.length > 0) {
      const createdRentals = await prisma.appointmentSlot.createMany({
        data: testRentals,
      });
      console.log(`✅ ${createdRentals.count} locations de test créées`);
    }

    // Afficher toutes les locations
    const allRentals = await prisma.appointmentSlot.findMany({
      where: {
        carId: rs3Car.id,
      },
      orderBy: {
        start: "asc",
      },
    });

    console.log("\n📅 Locations créées:");
    allRentals.forEach((rental, index) => {
      const departure = new Date(rental.start);
      const returnDate = new Date(rental.end);

      console.log(
        `${index + 1}. Départ: ${departure.toLocaleDateString("fr-FR")} à 9h00`
      );
      console.log(
        `   Retour: ${returnDate.toLocaleDateString("fr-FR")} à 8h45`
      );
      console.log(`   Client: ${rental.bookedBy}`);
      console.log("");
    });
  } catch (error) {
    console.error("❌ Erreur:", error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanAndSeedRentals()
  .then(() => {
    console.log("🎉 Nettoyage et seeding terminés!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Erreur fatale:", error);
    process.exit(1);
  });
