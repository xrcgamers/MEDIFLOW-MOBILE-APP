-- CreateTable
CREATE TABLE "ResourceActionLog" (
    "id" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "actionType" TEXT NOT NULL,
    "note" TEXT,
    "actorName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ResourceActionLog_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ResourceActionLog" ADD CONSTRAINT "ResourceActionLog_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "ResourceItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
