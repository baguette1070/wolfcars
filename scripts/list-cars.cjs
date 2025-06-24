import prisma from "../src/lib/prisma";

async function listCars() {
  try {
    console.log("🚗 Liste des voitures dans la base de données:");

    const cars = await prisma.car.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        createdAt: true,
      },
    });

    cars.forEach((car, index) => {
      console.log(`${index + 1}. ${car.name}`);
      console.log(`   ID: ${car.id}`);
      console.log(`   Description: ${car.description || "Aucune description"}`);
      console.log(`   Créée le: ${car.createdAt.toLocaleDateString("fr-FR")}`);
      console.log("");
    });
  } catch (error) {
    console.error("❌ Erreur:", error);
  } finally {
    await prisma.$disconnect();
  }
}

listCars()
  .then(() => {
    console.log("✅ Terminé!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Erreur fatale:", error);
    process.exit(1);
  });
