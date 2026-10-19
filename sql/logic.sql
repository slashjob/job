-- Behavior the schema cannot declare: the trigger that stamps a posting when it
-- moves, and the views whose bodies are not a column list.
-- Tables, indexes and the views derived from them are rendered from lib/core/ddl.ts.

DROP TRIGGER IF EXISTS on_kept;
DROP TRIGGER IF EXISTS on_kept_insert;
DROP TRIGGER IF EXISTS on_insert;
DROP TRIGGER IF EXISTS on_score;

-- The day the row last moved: a resume tailored for it. A re-fetch is not
-- progress, so `last_fetched` is not among the columns watched.
DROP TRIGGER IF EXISTS on_change;

CREATE TRIGGER IF NOT EXISTS on_change AFTER UPDATE OF resume ON postings
BEGIN
  UPDATE postings SET last_updated = date('now') WHERE key = new.key;
END;

-- The totals a form asks for as a number rather than a story, counted off
-- `employers` rather than stored: a written-down total is wrong by one every
-- year and can disagree with the dates printed on the resume. The clock starts
-- at the earliest employer and runs to today while one is current, to the last
-- finish once none is. Every employer here is work worth putting on a resume,
-- so the relevant total is the same span.
DROP VIEW IF EXISTS experience;
CREATE VIEW IF NOT EXISTS experience AS
  WITH span AS (
    SELECT MIN(CASE length(start) WHEN 4 THEN start || '-01-01'
                                  WHEN 7 THEN start || '-01' ELSE start END) AS opened,
           MAX(finish IS NULL) AS ongoing,
           MAX(CASE length(finish) WHEN 4 THEN finish || '-12-31'
                                   WHEN 7 THEN finish || '-01' ELSE finish END) AS closed
      FROM employers
  )
  SELECT opened AS clock_starts,
         CAST((julianday(CASE WHEN ongoing THEN date('now') ELSE closed END)
               - julianday(opened)) / 365.25 AS INTEGER) AS years,
         CAST((julianday(CASE WHEN ongoing THEN date('now') ELSE closed END)
               - julianday(opened)) / 365.25 AS INTEGER) AS relevant_years
    FROM span;

-- The whole career file, flattened for resume selection and for scoring.
DROP VIEW IF EXISTS career;
CREATE VIEW IF NOT EXISTS career AS
  SELECT e.name AS employer, e.title AS role, e.start AS employer_start,
         e.finish AS employer_end, p.id AS project_id, p.name AS project,
         p.about,
         (SELECT group_concat(technology, ', ') FROM
            (SELECT technology FROM project_technologies
              WHERE project_id = p.id ORDER BY technology)) AS technologies
  FROM employers e JOIN projects p ON p.employer_id = e.id
  ORDER BY e.seq, p.seq;
