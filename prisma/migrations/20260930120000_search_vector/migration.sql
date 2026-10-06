-- Готовый вектор поиска по тексту версии: хранится в самой таблице и обновляется триггером
-- при записи extracted_text, поэтому ранжирование не пересчитывает to_tsvector для каждой найденной строки.
-- (Обычный столбец + триггер, а не GENERATED: так Prisma не видит расхождения со схемой.)
ALTER TABLE "contract_versions" ADD COLUMN "search_vector" tsvector;

CREATE FUNCTION contract_versions_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector := to_tsvector('russian', coalesce(NEW.extracted_text, ''));
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

CREATE TRIGGER contract_versions_search_vector_trg
  BEFORE INSERT OR UPDATE OF "extracted_text" ON "contract_versions"
  FOR EACH ROW EXECUTE FUNCTION contract_versions_search_vector_update();

UPDATE "contract_versions" SET "search_vector" = to_tsvector('russian', coalesce("extracted_text", ''));

DROP INDEX "contract_versions_fts_idx";

CREATE INDEX "contract_versions_search_idx"
  ON "contract_versions"
  USING GIN ("search_vector");
