-- AlterTable
ALTER TABLE "projects" ADD COLUMN     "assetsContent" JSONB,
ADD COLUMN     "gameplayContent" JSONB,
ADD COLUMN     "pipelineStages" JSONB,
ADD COLUMN     "progress" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "prompt" TEXT,
ADD COLUMN     "publishingContent" JSONB,
ADD COLUMN     "qaContent" JSONB,
ADD COLUMN     "storyContent" JSONB,
ADD COLUMN     "thumbnail" TEXT;
