-- Normalize legacy enum values before shrinking the status model.
UPDATE "Incident"
SET "status" = 'IN_PROGRESS'
WHERE "status" = 'INVESTIGATING';

UPDATE "Incident"
SET "status" = 'RESOLVED'
WHERE "status" = 'CLOSED';

ALTER TYPE "IncidentStatus" RENAME TO "IncidentStatus_old";

CREATE TYPE "IncidentStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED');

ALTER TABLE "Incident"
ALTER COLUMN "status" DROP DEFAULT,
ALTER COLUMN "status" TYPE "IncidentStatus"
USING ("status"::text::"IncidentStatus"),
ALTER COLUMN "status" SET DEFAULT 'OPEN';

DROP TYPE "IncidentStatus_old";
