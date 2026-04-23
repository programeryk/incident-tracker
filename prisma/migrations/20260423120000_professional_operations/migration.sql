-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('OPERATOR', 'TECHNICIAN', 'SUPERVISOR', 'ADMIN');

-- CreateEnum
CREATE TYPE "IncidentEventType" AS ENUM ('CREATED', 'UPDATED', 'STATUS_CHANGED', 'ASSIGNED', 'COMMENTED', 'REOPENED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'OPERATOR',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdByUserId" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefreshSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RefreshSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Machine" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "area" TEXT NOT NULL,
    "line" TEXT,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdByUserId" TEXT,
    "updatedByUserId" TEXT,

    CONSTRAINT "Machine_pkey" PRIMARY KEY ("id")
);

-- Preserve existing incident machine identifiers as registry rows.
INSERT INTO "Machine" ("id", "code", "name", "area", "line", "isActive", "createdAt", "updatedAt")
SELECT
    'machine_' || regexp_replace(md5("machineId"), '[^a-z0-9]', '', 'g'),
    "machineId",
    "machineId",
    'Unassigned',
    NULL,
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM (SELECT DISTINCT "machineId" FROM "Incident") AS existing_machines
WHERE "machineId" IS NOT NULL;

-- AlterTable
ALTER TABLE "Incident" ADD COLUMN "assignedToUserId" TEXT;
ALTER TABLE "Incident" ADD COLUMN "createdByUserId" TEXT;
ALTER TABLE "Incident" ADD COLUMN "acknowledgedByUserId" TEXT;
ALTER TABLE "Incident" ADD COLUMN "resolvedByUserId" TEXT;

-- AlterTable
ALTER TABLE "IncidentComment" ADD COLUMN "userId" TEXT;

-- CreateTable
CREATE TABLE "IncidentEvent" (
    "id" TEXT NOT NULL,
    "incidentId" TEXT NOT NULL,
    "actorUserId" TEXT,
    "type" "IncidentEventType" NOT NULL,
    "message" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IncidentEvent_pkey" PRIMARY KEY ("id")
);

-- Backfill a creation event for existing incidents.
INSERT INTO "IncidentEvent" ("id", "incidentId", "type", "message", "metadata", "createdAt")
SELECT
    'event_' || regexp_replace(md5("id" || ':created'), '[^a-z0-9]', '', 'g'),
    "id",
    'CREATED',
    'Incident imported from existing data.',
    jsonb_build_object('legacyImport', true),
    "createdAt"
FROM "Incident";

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE INDEX "User_createdByUserId_idx" ON "User"("createdByUserId");
CREATE INDEX "RefreshSession_userId_idx" ON "RefreshSession"("userId");
CREATE INDEX "RefreshSession_expiresAt_idx" ON "RefreshSession"("expiresAt");
CREATE UNIQUE INDEX "Machine_code_key" ON "Machine"("code");
CREATE INDEX "Machine_area_idx" ON "Machine"("area");
CREATE INDEX "Machine_line_idx" ON "Machine"("line");
CREATE INDEX "Machine_isActive_idx" ON "Machine"("isActive");
CREATE INDEX "Machine_createdByUserId_idx" ON "Machine"("createdByUserId");
CREATE INDEX "Machine_updatedByUserId_idx" ON "Machine"("updatedByUserId");
CREATE INDEX "Incident_createdByUserId_idx" ON "Incident"("createdByUserId");
CREATE INDEX "Incident_assignedToUserId_idx" ON "Incident"("assignedToUserId");
CREATE INDEX "Incident_acknowledgedByUserId_idx" ON "Incident"("acknowledgedByUserId");
CREATE INDEX "Incident_resolvedByUserId_idx" ON "Incident"("resolvedByUserId");
CREATE INDEX "IncidentComment_userId_idx" ON "IncidentComment"("userId");
CREATE INDEX "IncidentEvent_incidentId_idx" ON "IncidentEvent"("incidentId");
CREATE INDEX "IncidentEvent_actorUserId_idx" ON "IncidentEvent"("actorUserId");
CREATE INDEX "IncidentEvent_type_idx" ON "IncidentEvent"("type");
CREATE INDEX "IncidentEvent_createdAt_idx" ON "IncidentEvent"("createdAt");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "RefreshSession" ADD CONSTRAINT "RefreshSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Machine" ADD CONSTRAINT "Machine_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Machine" ADD CONSTRAINT "Machine_updatedByUserId_fkey" FOREIGN KEY ("updatedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Incident" ADD CONSTRAINT "Incident_machineId_fkey" FOREIGN KEY ("machineId") REFERENCES "Machine"("code") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Incident" ADD CONSTRAINT "Incident_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Incident" ADD CONSTRAINT "Incident_assignedToUserId_fkey" FOREIGN KEY ("assignedToUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Incident" ADD CONSTRAINT "Incident_acknowledgedByUserId_fkey" FOREIGN KEY ("acknowledgedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Incident" ADD CONSTRAINT "Incident_resolvedByUserId_fkey" FOREIGN KEY ("resolvedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "IncidentComment" ADD CONSTRAINT "IncidentComment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "IncidentEvent" ADD CONSTRAINT "IncidentEvent_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "Incident"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "IncidentEvent" ADD CONSTRAINT "IncidentEvent_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
