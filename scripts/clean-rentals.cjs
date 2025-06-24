const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function cleanRentals() {
  try {
    console.log("🧹 Nettoyage des réservations en cours...");

    // Compter les réservations avant suppression
    const countBefore = await prisma.appointmentSlot.count({
      where: {
        isBooked: true,
      },
    });

    console.log(`📊 Nombre de réservations avant nettoyage: ${countBefore}`);

    // Supprimer toutes les réservations
    const deletedRentals = await prisma.appointmentSlot.deleteMany({
      where: {
        isBooked: true,
      },
    });

    console.log(
      `✅ ${deletedRentals.count} réservations supprimées avec succès!`
    );

    // Vérifier qu'il ne reste plus de réservations
    const countAfter = await prisma.appointmentSlot.count({
      where: {
        isBooked: true,
      },
    });

    console.log(`📊 Nombre de réservations après nettoyage: ${countAfter}`);

    if (countAfter === 0) {
      console.log(
        "🎉 Toutes les places sont maintenant libres pour la réservation!"
      );
    } else {
      console.log("⚠️  Il reste encore des réservations...");
    }
  } catch (error) {
    console.error("❌ Erreur lors du nettoyage:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le script
cleanRentals();
