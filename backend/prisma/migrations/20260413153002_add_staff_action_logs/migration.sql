-- CreateTable
CREATE TABLE "StaffActionLog" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "actionType" TEXT NOT NULL,
    "status" TEXT,
    "note" TEXT,
    "actorName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StaffActionLog_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "StaffActionLog" ADD CONSTRAINT "StaffActionLog_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report"("id") ON DELETE CASCADE ON UPDATE CASCADE;
