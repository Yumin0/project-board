-- AlterTable
ALTER TABLE "category_fields" ADD COLUMN     "options" TEXT[] DEFAULT ARRAY[]::TEXT[];
