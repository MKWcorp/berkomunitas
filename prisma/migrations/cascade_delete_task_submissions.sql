-- Migration: Update task_submissions foreign key to cascade delete
-- This allows automatic deletion of submissions when a task is deleted

-- Drop the existing foreign key constraint
ALTER TABLE "task_submissions" 
DROP CONSTRAINT IF EXISTS "fk_task_submissions_tugas_ai";

-- Add the new constraint with CASCADE delete
ALTER TABLE "task_submissions" 
ADD CONSTRAINT "fk_task_submissions_tugas_ai" 
FOREIGN KEY ("id_task") 
REFERENCES "tugas_ai"("id") 
ON DELETE CASCADE 
ON UPDATE NO ACTION;
