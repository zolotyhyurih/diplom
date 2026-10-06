-- Отключённая учётная запись не может войти в систему, но остаётся в журнале и у своих договоров.
ALTER TABLE "users" ADD COLUMN "active" BOOLEAN NOT NULL DEFAULT true;
