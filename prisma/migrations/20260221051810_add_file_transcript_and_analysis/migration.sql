-- CreateTable
CREATE TABLE "file_transcripts" (
    "id" SERIAL NOT NULL,
    "uuid" UUID NOT NULL,
    "file_id" UUID NOT NULL,
    "transcript" TEXT NOT NULL,
    "language" VARCHAR(10),
    "duration" INTEGER,
    "word_count" INTEGER,
    "whisper_model" VARCHAR(50),
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "file_transcripts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "file_analyses" (
    "id" SERIAL NOT NULL,
    "uuid" UUID NOT NULL,
    "file_id" UUID NOT NULL,
    "summary" TEXT,
    "key_decisions" JSONB,
    "risks" JSONB,
    "dependencies" JSONB,
    "logic_flags" JSONB,
    "claude_model" VARCHAR(50),
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "file_analyses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "file_transcripts_uuid_key" ON "file_transcripts"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "file_transcripts_file_id_key" ON "file_transcripts"("file_id");

-- CreateIndex
CREATE INDEX "file_transcripts_file_id_idx" ON "file_transcripts"("file_id");

-- CreateIndex
CREATE INDEX "file_transcripts_status_idx" ON "file_transcripts"("status");

-- CreateIndex
CREATE UNIQUE INDEX "file_analyses_uuid_key" ON "file_analyses"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "file_analyses_file_id_key" ON "file_analyses"("file_id");

-- CreateIndex
CREATE INDEX "file_analyses_file_id_idx" ON "file_analyses"("file_id");

-- CreateIndex
CREATE INDEX "file_analyses_status_idx" ON "file_analyses"("status");

-- AddForeignKey
ALTER TABLE "file_transcripts" ADD CONSTRAINT "file_transcripts_file_id_fkey" FOREIGN KEY ("file_id") REFERENCES "files"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "file_analyses" ADD CONSTRAINT "file_analyses_file_id_fkey" FOREIGN KEY ("file_id") REFERENCES "files"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;
