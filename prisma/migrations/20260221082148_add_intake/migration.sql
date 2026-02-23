-- CreateTable
CREATE TABLE "intakes" (
    "id" SERIAL NOT NULL,
    "uuid" UUID NOT NULL,
    "source_file_id" UUID,
    "project_id" UUID,
    "title" VARCHAR(500) NOT NULL,
    "status" VARCHAR(50) NOT NULL,
    "created_by_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "intakes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "intakes_uuid_key" ON "intakes"("uuid");

-- CreateIndex
CREATE INDEX "intakes_source_file_id_idx" ON "intakes"("source_file_id");

-- CreateIndex
CREATE INDEX "intakes_project_id_idx" ON "intakes"("project_id");

-- CreateIndex
CREATE INDEX "intakes_status_idx" ON "intakes"("status");

-- CreateIndex
CREATE INDEX "intakes_created_at_idx" ON "intakes"("created_at");

-- AddForeignKey
ALTER TABLE "intakes" ADD CONSTRAINT "intakes_source_file_id_fkey" FOREIGN KEY ("source_file_id") REFERENCES "files"("uuid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "intakes" ADD CONSTRAINT "intakes_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("uuid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "intakes" ADD CONSTRAINT "intakes_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("uuid") ON DELETE SET NULL ON UPDATE CASCADE;
