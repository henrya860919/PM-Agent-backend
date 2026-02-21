-- CreateTable
CREATE TABLE "files" (
    "id" SERIAL NOT NULL,
    "uuid" UUID NOT NULL,
    "project_id" UUID,
    "original_filename" VARCHAR(255) NOT NULL,
    "filename" VARCHAR(255) NOT NULL,
    "file_size" BIGINT NOT NULL,
    "mime_type" VARCHAR(100) NOT NULL,
    "extension" VARCHAR(10),
    "storage_path" TEXT NOT NULL,
    "storage_type" VARCHAR(20) NOT NULL,
    "file_hash" VARCHAR(64) NOT NULL,
    "business_type" VARCHAR(50) NOT NULL,
    "business_id" VARCHAR(255),
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "tags" JSONB,
    "uploaded_by_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "deleted_by_id" UUID,

    CONSTRAINT "files_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "files_uuid_key" ON "files"("uuid");

-- CreateIndex
CREATE INDEX "files_project_id_idx" ON "files"("project_id");

-- CreateIndex
CREATE INDEX "files_uploaded_by_id_idx" ON "files"("uploaded_by_id");

-- CreateIndex
CREATE INDEX "files_file_hash_idx" ON "files"("file_hash");

-- CreateIndex
CREATE INDEX "files_business_type_business_id_idx" ON "files"("business_type", "business_id");

-- CreateIndex
CREATE INDEX "files_created_at_idx" ON "files"("created_at");

-- CreateIndex
CREATE INDEX "files_deleted_at_idx" ON "files"("deleted_at");

-- AddForeignKey
ALTER TABLE "files" ADD CONSTRAINT "files_uploaded_by_id_fkey" FOREIGN KEY ("uploaded_by_id") REFERENCES "users"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "files" ADD CONSTRAINT "files_deleted_by_id_fkey" FOREIGN KEY ("deleted_by_id") REFERENCES "users"("uuid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "files" ADD CONSTRAINT "files_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("uuid") ON DELETE SET NULL ON UPDATE CASCADE;
