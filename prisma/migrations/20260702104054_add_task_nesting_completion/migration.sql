-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Task" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "dueDate" DATETIME,
    "dueTime" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "order" REAL NOT NULL DEFAULT 0,
    "recurrenceType" TEXT NOT NULL DEFAULT 'NONE',
    "recurrenceInterval" INTEGER,
    "recurrenceEndDate" DATETIME,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" DATETIME,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "columnId" TEXT NOT NULL,
    "parentId" TEXT,
    CONSTRAINT "Task_columnId_fkey" FOREIGN KEY ("columnId") REFERENCES "Column" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Task_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Task" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Task" ("archived", "columnId", "createdAt", "deletedAt", "description", "dueDate", "dueTime", "id", "order", "priority", "recurrenceEndDate", "recurrenceInterval", "recurrenceType", "title", "updatedAt") SELECT "archived", "columnId", "createdAt", "deletedAt", "description", "dueDate", "dueTime", "id", "order", "priority", "recurrenceEndDate", "recurrenceInterval", "recurrenceType", "title", "updatedAt" FROM "Task";
DROP TABLE "Task";
ALTER TABLE "new_Task" RENAME TO "Task";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
