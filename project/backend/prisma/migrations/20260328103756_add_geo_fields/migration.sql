-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Order" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "clientId" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "totalBoxes" INTEGER NOT NULL,
    "address" TEXT NOT NULL DEFAULT '',
    "lat" REAL,
    "lon" REAL,
    "deliveryWindowStart" TEXT NOT NULL DEFAULT '08:00',
    "deliveryWindowEnd" TEXT NOT NULL DEFAULT '18:00',
    "signature" TEXT,
    "deliveredAt" DATETIME,
    "deliveredById" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Order_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Order" ("clientId", "createdAt", "deliveredAt", "deliveredById", "id", "signature", "status", "totalBoxes", "updatedAt") SELECT "clientId", "createdAt", "deliveredAt", "deliveredById", "id", "signature", "status", "totalBoxes", "updatedAt" FROM "Order";
DROP TABLE "Order";
ALTER TABLE "new_Order" RENAME TO "Order";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
