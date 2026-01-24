-- CreateTable
CREATE TABLE "account_groups" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL DEFAULT 'shared',
    "created_by" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "account_group_members" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "account_group_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'member',
    "joined_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "account_group_members_account_group_id_fkey" FOREIGN KEY ("account_group_id") REFERENCES "account_groups" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "account_group_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "account_group_invitations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "account_group_id" TEXT NOT NULL,
    "inviter_id" TEXT NOT NULL,
    "invitee_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "expires_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "account_group_invitations_account_group_id_fkey" FOREIGN KEY ("account_group_id") REFERENCES "account_groups" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "account_group_invitations_inviter_id_fkey" FOREIGN KEY ("inviter_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "account_group_invitations_invitee_id_fkey" FOREIGN KEY ("invitee_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_groups" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "user_id" TEXT NOT NULL,
    "account_group_id" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "groups_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "groups_account_group_id_fkey" FOREIGN KEY ("account_group_id") REFERENCES "account_groups" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_groups" ("created_at", "description", "id", "name", "updated_at", "user_id") SELECT "created_at", "description", "id", "name", "updated_at", "user_id" FROM "groups";
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
    "account_group_id" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "items_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "items_account_group_id_fkey" FOREIGN KEY ("account_group_id") REFERENCES "account_groups" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_items" ("cityName", "created_at", "description", "id", "mediaUrl", "prefectureId", "status", "tags", "title", "updated_at", "user_id") SELECT "cityName", "created_at", "description", "id", "mediaUrl", "prefectureId", "status", "tags", "title", "updated_at", "user_id" FROM "items";
DROP TABLE "items";
ALTER TABLE "new_items" RENAME TO "items";
CREATE INDEX "items_prefectureId_idx" ON "items"("prefectureId");
CREATE INDEX "items_user_id_idx" ON "items"("user_id");
CREATE INDEX "items_account_group_id_idx" ON "items"("account_group_id");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "account_groups_created_by_idx" ON "account_groups"("created_by");

-- CreateIndex
CREATE INDEX "account_groups_type_idx" ON "account_groups"("type");

-- CreateIndex
CREATE INDEX "account_group_members_account_group_id_idx" ON "account_group_members"("account_group_id");

-- CreateIndex
CREATE INDEX "account_group_members_user_id_idx" ON "account_group_members"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "account_group_members_account_group_id_user_id_key" ON "account_group_members"("account_group_id", "user_id");

-- CreateIndex
CREATE INDEX "account_group_invitations_account_group_id_idx" ON "account_group_invitations"("account_group_id");

-- CreateIndex
CREATE INDEX "account_group_invitations_invitee_id_idx" ON "account_group_invitations"("invitee_id");

-- CreateIndex
CREATE INDEX "account_group_invitations_status_idx" ON "account_group_invitations"("status");

-- 既存データのマイグレーション: 各ユーザーに対して個人用アカウントグループを作成
-- 注意: このマイグレーション後、migrate-to-account-groups.ts スクリプトを実行して
-- 既存のItemとGroupに個人用グループを割り当てる必要があります
