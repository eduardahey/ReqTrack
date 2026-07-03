-- CreateTable
CREATE TABLE "AcceptanceCriterion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "text" TEXT NOT NULL,
    "done" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "requirementId" TEXT,
    "userStoryId" TEXT,
    CONSTRAINT "AcceptanceCriterion_requirementId_fkey" FOREIGN KEY ("requirementId") REFERENCES "Requirement" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AcceptanceCriterion_userStoryId_fkey" FOREIGN KEY ("userStoryId") REFERENCES "UserStory" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_RequirementToUserStory" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_RequirementToUserStory_A_fkey" FOREIGN KEY ("A") REFERENCES "Requirement" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_RequirementToUserStory_B_fkey" FOREIGN KEY ("B") REFERENCES "UserStory" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_RequirementPrerequisites" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_RequirementPrerequisites_A_fkey" FOREIGN KEY ("A") REFERENCES "Requirement" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_RequirementPrerequisites_B_fkey" FOREIGN KEY ("B") REFERENCES "Requirement" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- DataMigration: preserve existing free-text acceptance criteria as a single checklist item each
INSERT INTO "AcceptanceCriterion" ("id", "text", "done", "order", "createdAt", "requirementId", "userStoryId")
SELECT lower(hex(randomblob(4)) || '-' || hex(randomblob(4))), "acceptance", false, 0, CURRENT_TIMESTAMP, "id", NULL
FROM "Requirement"
WHERE "acceptance" IS NOT NULL AND trim("acceptance") <> '';

INSERT INTO "AcceptanceCriterion" ("id", "text", "done", "order", "createdAt", "requirementId", "userStoryId")
SELECT lower(hex(randomblob(4)) || '-' || hex(randomblob(4))), "acceptance", false, 0, CURRENT_TIMESTAMP, NULL, "id"
FROM "UserStory"
WHERE "acceptance" IS NOT NULL AND trim("acceptance") <> '';

-- DataMigration: preserve existing UserStory.requirementId link into the new many-to-many table
INSERT INTO "_RequirementToUserStory" ("A", "B")
SELECT "requirementId", "id" FROM "UserStory" WHERE "requirementId" IS NOT NULL;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Requirement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "actor" TEXT,
    "category" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "projectId" TEXT NOT NULL,
    CONSTRAINT "Requirement_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Requirement" ("actor", "category", "createdAt", "description", "id", "priority", "projectId", "status", "title", "type", "updatedAt") SELECT "actor", "category", "createdAt", "description", "id", "priority", "projectId", "status", "title", "type", "updatedAt" FROM "Requirement";
DROP TABLE "Requirement";
ALTER TABLE "new_Requirement" RENAME TO "Requirement";
CREATE TABLE "new_UserStory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userType" TEXT NOT NULL,
    "feature" TEXT NOT NULL,
    "benefit" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "projectId" TEXT NOT NULL,
    CONSTRAINT "UserStory_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_UserStory" ("benefit", "createdAt", "feature", "id", "priority", "projectId", "status", "updatedAt", "userType") SELECT "benefit", "createdAt", "feature", "id", "priority", "projectId", "status", "updatedAt", "userType" FROM "UserStory";
DROP TABLE "UserStory";
ALTER TABLE "new_UserStory" RENAME TO "UserStory";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "_RequirementToUserStory_AB_unique" ON "_RequirementToUserStory"("A", "B");

-- CreateIndex
CREATE INDEX "_RequirementToUserStory_B_index" ON "_RequirementToUserStory"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_RequirementPrerequisites_AB_unique" ON "_RequirementPrerequisites"("A", "B");

-- CreateIndex
CREATE INDEX "_RequirementPrerequisites_B_index" ON "_RequirementPrerequisites"("B");
