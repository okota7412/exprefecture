-- CreateTable
CREATE TABLE "groups" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "user_id" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "groups_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "item_groups" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "item_id" TEXT NOT NULL,
    "group_id" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "item_groups_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "items" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "item_groups_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "groups" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "prefectureId" INTEGER,
    "cityName" TEXT,
    "status" TEXT NOT NULL DEFAULT 'not_visited',
    "tags" TEXT NOT NULL,
    "mediaUrl" TEXT,
    "user_id" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "items_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_items" ("cityName", "created_at", "description", "id", "mediaUrl", "prefectureId", "status", "tags", "title", "updated_at", "user_id") SELECT "cityName", "created_at", "description", "id", "mediaUrl", "prefectureId", "status", "tags", "title", "updated_at", "user_id" FROM "items";
DROP TABLE "items";
ALTER TABLE "new_items" RENAME TO "items";
CREATE INDEX "items_prefectureId_idx" ON "items"("prefectureId");
CREATE INDEX "items_user_id_idx" ON "items"("user_id");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "groups_user_id_idx" ON "groups"("user_id");

-- CreateIndex
CREATE INDEX "item_groups_item_id_idx" ON "item_groups"("item_id");

-- CreateIndex
CREATE INDEX "item_groups_group_id_idx" ON "item_groups"("group_id");

-- CreateIndex
CREATE UNIQUE INDEX "item_groups_item_id_group_id_key" ON "item_groups"("item_id", "group_id");
