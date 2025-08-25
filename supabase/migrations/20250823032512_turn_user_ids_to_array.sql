ALTER TABLE repo_snapshots
ADD COLUMN "userIds" uuid[] DEFAULT '{}';

UPDATE repo_snapshots
SET "userIds" = ARRAY["userId"]
WHERE "userId" IS NOT NULL;