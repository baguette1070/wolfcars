-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_AppointmentSlot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "carId" TEXT NOT NULL,
    "start" DATETIME NOT NULL,
    "end" DATETIME NOT NULL,
    "isBooked" BOOLEAN NOT NULL DEFAULT false,
    "bookedBy" TEXT,
    "paymentStatus" TEXT NOT NULL DEFAULT 'pending_deposit',
    "depositPaid" BOOLEAN NOT NULL DEFAULT false,
    "depositAmount" INTEGER NOT NULL DEFAULT 50,
    "remainingAmount" INTEGER,
    "stripeSessionId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AppointmentSlot_carId_fkey" FOREIGN KEY ("carId") REFERENCES "Car" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_AppointmentSlot" ("bookedBy", "carId", "createdAt", "end", "id", "isBooked", "start", "updatedAt") SELECT "bookedBy", "carId", "createdAt", "end", "id", "isBooked", "start", "updatedAt" FROM "AppointmentSlot";
DROP TABLE "AppointmentSlot";
ALTER TABLE "new_AppointmentSlot" RENAME TO "AppointmentSlot";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
