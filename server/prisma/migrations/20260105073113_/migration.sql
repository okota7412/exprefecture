-- CreateTable
CREATE TABLE "items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "prefectureId" INTEGER NOT NULL,
    "cityName" TEXT,
    "status" TEXT NOT NULL DEFAULT 'not_visited',
    "tags" TEXT NOT NULL,
    "mediaUrl" TEXT,
    "user_id" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "items_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "items_prefectureId_idx" ON "items"("prefectureId");

-- CreateIndex
CREATE INDEX "items_user_id_idx" ON "items"("user_id");
