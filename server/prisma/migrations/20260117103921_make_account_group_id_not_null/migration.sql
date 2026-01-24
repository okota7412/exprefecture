/*
  Warnings:

  - Made the column `account_group_id` on table `groups` required. This step will fail if there are existing NULL values in that column.
  - Made the column `account_group_id` on table `items` required. This step will fail if there are existing NULL values in that column.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_groups" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "user_id" TEXT NOT NULL,
    "account_group_id" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "groups_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "groups_account_group_id_fkey" FOREIGN KEY ("account_group_id") REFERENCES "account_groups" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_groups" ("account_group_id", "created_at", "description", "id", "name", "updated_at", "user_id") SELECT "account_group_id", "created_at", "description", "id", "name", "updated_at", "user_id" FROM "groups";
DROP TABLE "groups";
ALTER TABLE "new_groups" RENAME TO "groups";
CREATE INDEX "groups_user_id_idx" ON "groups"("user_id");
CREATE INDEX "groups_account_group_id_idx" ON "groups"("account_group_id");
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
    "account_group_id" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "items_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "items_account_group_id_fkey" FOREIGN KEY ("account_group_id") REFERENCES "account_groups" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_items" ("account_group_id", "cityName", "created_at", "description", "id", "mediaUrl", "prefectureId", "status", "tags", "title", "updated_at", "user_id") SELECT "account_group_id", "cityName", "created_at", "description", "id", "mediaUrl", "prefectureId", "status", "tags", "title", "updated_at", "user_id" FROM "items";
DROP TABLE "items";
ALTER TABLE "new_items" RENAME TO "items";
CREATE INDEX "items_prefectureId_idx" ON "items"("prefectureId");
CREATE INDEX "items_user_id_idx" ON "items"("user_id");
CREATE INDEX "items_account_group_id_idx" ON "items"("account_group_id");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
