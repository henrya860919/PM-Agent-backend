-- CreateTable
CREATE TABLE "meeting_notes" (
    "id" SERIAL NOT NULL,
    "uuid" UUID NOT NULL,
    "type" VARCHAR(20) NOT NULL,
    "title" VARCHAR(500) NOT NULL,
    "content" TEXT NOT NULL,
    "project_id" UUID,
    "source_intake_id" UUID,
    "created_by_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "meeting_notes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "meeting_notes_uuid_key" ON "meeting_notes"("uuid");

-- CreateIndex
CREATE INDEX "meeting_notes_source_intake_id_idx" ON "meeting_notes"("source_intake_id");

-- CreateIndex
CREATE INDEX "meeting_notes_project_id_idx" ON "meeting_notes"("project_id");

-- CreateIndex
CREATE INDEX "meeting_notes_type_idx" ON "meeting_notes"("type");

-- CreateIndex
CREATE INDEX "meeting_notes_created_at_idx" ON "meeting_notes"("created_at");

-- AddForeignKey
ALTER TABLE "meeting_notes" ADD CONSTRAINT "meeting_notes_source_intake_id_fkey" FOREIGN KEY ("source_intake_id") REFERENCES "intakes"("uuid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meeting_notes" ADD CONSTRAINT "meeting_notes_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("uuid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meeting_notes" ADD CONSTRAINT "meeting_notes_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("uuid") ON DELETE SET NULL ON UPDATE CASCADE;
