-- AlterTable
ALTER TABLE "Meeting" ADD COLUMN "tags" TEXT;

-- CreateTable
CREATE TABLE "_MeetingToStakeholder" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_MeetingToStakeholder_A_fkey" FOREIGN KEY ("A") REFERENCES "Meeting" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_MeetingToStakeholder_B_fkey" FOREIGN KEY ("B") REFERENCES "Stakeholder" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "_MeetingToStakeholder_AB_unique" ON "_MeetingToStakeholder"("A", "B");

-- CreateIndex
CREATE INDEX "_MeetingToStakeholder_B_index" ON "_MeetingToStakeholder"("B");

