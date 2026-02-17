import Database from '@ansvar/mcp-sqlite';

const SCHEMA = `
CREATE TABLE legal_documents (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  status TEXT NOT NULL,
  issued_date TEXT,
  in_force_date TEXT,
  url TEXT,
  description TEXT,
  language TEXT,
  numac TEXT,
  last_updated TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE legal_provisions (
  id INTEGER PRIMARY KEY,
  document_id TEXT NOT NULL REFERENCES legal_documents(id),
  provision_ref TEXT NOT NULL,
  chapter TEXT,
  section TEXT NOT NULL,
  title TEXT,
  content TEXT NOT NULL,
  language TEXT,
  metadata TEXT,
  UNIQUE(document_id, provision_ref)
);

CREATE INDEX idx_provisions_doc ON legal_provisions(document_id);

CREATE VIRTUAL TABLE provisions_fts USING fts5(
  content, title,
  content='legal_provisions',
  content_rowid='id',
  tokenize='unicode61'
);

CREATE TRIGGER provisions_ai AFTER INSERT ON legal_provisions BEGIN
  INSERT INTO provisions_fts(rowid, content, title)
  VALUES (new.id, new.content, new.title);
END;

CREATE TRIGGER provisions_ad AFTER DELETE ON legal_provisions BEGIN
  INSERT INTO provisions_fts(provisions_fts, rowid, content, title)
  VALUES ('delete', old.id, old.content, old.title);
END;

CREATE TRIGGER provisions_au AFTER UPDATE ON legal_provisions BEGIN
  INSERT INTO provisions_fts(provisions_fts, rowid, content, title)
  VALUES ('delete', old.id, old.content, old.title);
  INSERT INTO provisions_fts(rowid, content, title)
  VALUES (new.id, new.content, new.title);
END;

CREATE TABLE legal_provision_versions (
  id INTEGER PRIMARY KEY,
  document_id TEXT NOT NULL REFERENCES legal_documents(id),
  provision_ref TEXT NOT NULL,
  chapter TEXT,
  section TEXT NOT NULL,
  title TEXT,
  content TEXT NOT NULL,
  language TEXT,
  metadata TEXT,
  valid_from TEXT,
  valid_to TEXT
);

CREATE INDEX idx_provision_versions_doc_ref
  ON legal_provision_versions(document_id, provision_ref);

CREATE VIRTUAL TABLE provision_versions_fts USING fts5(
  content, title,
  content='legal_provision_versions',
  content_rowid='id',
  tokenize='unicode61'
);

CREATE TRIGGER provision_versions_ai AFTER INSERT ON legal_provision_versions BEGIN
  INSERT INTO provision_versions_fts(rowid, content, title)
  VALUES (new.id, new.content, new.title);
END;

CREATE TRIGGER provision_versions_ad AFTER DELETE ON legal_provision_versions BEGIN
  INSERT INTO provision_versions_fts(provision_versions_fts, rowid, content, title)
  VALUES ('delete', old.id, old.content, old.title);
END;

CREATE TRIGGER provision_versions_au AFTER UPDATE ON legal_provision_versions BEGIN
  INSERT INTO provision_versions_fts(provision_versions_fts, rowid, content, title)
  VALUES ('delete', old.id, old.content, old.title);
  INSERT INTO provision_versions_fts(rowid, content, title)
  VALUES (new.id, new.content, new.title);
END;

CREATE TABLE case_law (
  id INTEGER PRIMARY KEY,
  document_id TEXT NOT NULL,
  court TEXT,
  case_number TEXT,
  decision_date TEXT,
  summary TEXT,
  keywords TEXT
);

CREATE TABLE eu_documents (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  year INTEGER NOT NULL,
  number INTEGER NOT NULL,
  community TEXT,
  celex_number TEXT,
  title TEXT,
  short_name TEXT,
  url_eur_lex TEXT,
  in_force BOOLEAN DEFAULT 1,
  amended_by TEXT,
  repeals TEXT
);

CREATE TABLE eu_references (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_type TEXT NOT NULL,
  source_id TEXT NOT NULL,
  document_id TEXT NOT NULL REFERENCES legal_documents(id),
  provision_id INTEGER REFERENCES legal_provisions(id),
  eu_document_id TEXT NOT NULL REFERENCES eu_documents(id),
  eu_article TEXT,
  reference_type TEXT NOT NULL,
  reference_context TEXT,
  full_citation TEXT,
  is_primary_implementation BOOLEAN DEFAULT 0,
  implementation_status TEXT
);

CREATE INDEX idx_eu_references_document ON eu_references(document_id, eu_document_id);
CREATE INDEX idx_eu_references_provision ON eu_references(provision_id, eu_document_id);

CREATE TABLE db_metadata (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
`;

interface SeedDocument {
  id: string;
  type: 'statute' | 'case_law';
  title: string;
  status: 'in_force' | 'amended' | 'repealed' | 'not_yet_in_force';
  issued_date?: string;
  in_force_date?: string;
  url?: string;
  language?: string;
  numac?: string;
}

interface SeedProvision {
  document_id: string;
  provision_ref: string;
  chapter?: string;
  section: string;
  title?: string;
  content: string;
  language?: string;
}

const DOCUMENTS: SeedDocument[] = [
  {
    id: 'loi-1994-02-02-1994009284-fr',
    type: 'statute',
    title: 'Loi du 2 fevrier 1994 relative a la protection de la jeunesse',
    status: 'in_force',
    issued_date: '1994-02-02',
    in_force_date: '1994-03-01',
    url: 'http://www.ejustice.just.fgov.be/eli/loi/1994/02/02/1994009284/justel',
    language: 'fr',
    numac: '1994009284',
  },
  {
    id: 'wet-1994-02-02-1994009284-nl',
    type: 'statute',
    title: 'Wet van 2 februari 1994 betreffende de jeugdbescherming',
    status: 'in_force',
    issued_date: '1994-02-02',
    in_force_date: '1994-03-01',
    url: 'http://www.ejustice.just.fgov.be/eli/wet/1994/02/02/1994009284/justel',
    language: 'nl',
    numac: '1994009284',
  },
  {
    id: 'loi-1994-02-10-1994009323-fr',
    type: 'statute',
    title: 'Loi du 10 fevrier 1994 sur la mediation penale',
    status: 'repealed',
    issued_date: '1994-02-10',
    in_force_date: '1994-04-01',
    url: 'http://www.ejustice.just.fgov.be/eli/loi/1994/02/10/1994009323/justel',
    language: 'fr',
    numac: '1994009323',
  },
  {
    id: 'loi-1992-12-08-1992009783-fr',
    type: 'statute',
    title: 'Loi du 8 decembre 1992 relative a la vie privee',
    status: 'amended',
    issued_date: '1992-12-08',
    in_force_date: '1993-01-01',
    url: 'http://www.ejustice.just.fgov.be/eli/loi/1992/12/08/1992009783/justel',
    language: 'fr',
    numac: '1992009783',
  },
];

const PROVISIONS: SeedProvision[] = [
  {
    document_id: 'loi-1994-02-02-1994009284-fr',
    provision_ref: 'art1',
    section: '1',
    title: 'Article 1',
    content: 'La presente loi protege la jeunesse et organise les mesures de protection.',
    language: 'fr',
  },
  {
    document_id: 'loi-1994-02-02-1994009284-fr',
    provision_ref: 'art10',
    section: '10',
    title: 'Article 10',
    content: 'Le tribunal de la jeunesse peut prendre des mesures de protection adaptees.',
    language: 'fr',
  },
  {
    document_id: 'wet-1994-02-02-1994009284-nl',
    provision_ref: 'art1',
    section: '1',
    title: 'Artikel 1',
    content: 'Deze wet beschermt de jeugd en stelt beschermingsmaatregelen vast.',
    language: 'nl',
  },
  {
    document_id: 'loi-1994-02-10-1994009323-fr',
    provision_ref: 'art1',
    section: '1',
    title: 'Article 1',
    content: 'La mediation penale est organisee devant le tribunal competent.',
    language: 'fr',
  },
  {
    document_id: 'loi-1992-12-08-1992009783-fr',
    provision_ref: 'art1',
    section: '1',
    title: 'Article 1',
    content: 'La presente loi encadre le traitement des donnees personnelles et de la vie privee.',
    language: 'fr',
  },
];

export function createTestDatabase(): InstanceType<typeof Database> {
  const db = new Database(':memory:');
  db.exec(SCHEMA);

  const insertDoc = db.prepare(`
    INSERT INTO legal_documents (id, type, title, status, issued_date, in_force_date, url, language, numac)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const document of DOCUMENTS) {
    insertDoc.run(
      document.id,
      document.type,
      document.title,
      document.status,
      document.issued_date ?? null,
      document.in_force_date ?? null,
      document.url ?? null,
      document.language ?? null,
      document.numac ?? null,
    );
  }

  const insertProvision = db.prepare(`
    INSERT INTO legal_provisions (document_id, provision_ref, chapter, section, title, content, language, metadata)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const provisionIds = new Map<string, number>();
  for (const provision of PROVISIONS) {
    const info = insertProvision.run(
      provision.document_id,
      provision.provision_ref,
      provision.chapter ?? null,
      provision.section,
      provision.title ?? null,
      provision.content,
      provision.language ?? null,
      null,
    );
    provisionIds.set(`${provision.document_id}:${provision.provision_ref}`, Number(info.lastInsertRowid));
  }

  const insertVersion = db.prepare(`
    INSERT INTO legal_provision_versions (document_id, provision_ref, chapter, section, title, content, language, metadata, valid_from, valid_to)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertVersion.run(
    'loi-1994-02-02-1994009284-fr',
    'art1',
    null,
    '1',
    'Article 1',
    'Ancien texte: la loi protege la jeunesse selon la version initiale.',
    'fr',
    null,
    '1994-03-01',
    '2010-01-01',
  );

  insertVersion.run(
    'loi-1994-02-02-1994009284-fr',
    'art1',
    null,
    '1',
    'Article 1',
    'Texte modernise: la loi protege la jeunesse et renforce la protection des mineurs.',
    'fr',
    null,
    '2010-01-01',
    null,
  );

  insertVersion.run(
    'loi-1994-02-02-1994009284-fr',
    'art10',
    null,
    '10',
    'Article 10',
    'Historique: le tribunal de la jeunesse peut statuer sur les mesures.',
    'fr',
    null,
    '1994-03-01',
    null,
  );

  const insertEuDoc = db.prepare(`
    INSERT INTO eu_documents (id, type, year, number, community, celex_number, title, short_name, url_eur_lex, in_force, amended_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertEuDoc.run(
    'regulation:2016/679',
    'regulation',
    2016,
    679,
    'EU',
    '32016R0679',
    'General Data Protection Regulation',
    'GDPR',
    'https://eur-lex.europa.eu/eli/reg/2016/679/oj',
    1,
    null,
  );

  insertEuDoc.run(
    'directive:95/46',
    'directive',
    1995,
    46,
    'EU',
    '31995L0046',
    'Data Protection Directive',
    'DPD',
    'https://eur-lex.europa.eu/eli/dir/1995/46/oj',
    0,
    '["regulation:2016/679"]',
  );

  const insertEuRef = db.prepare(`
    INSERT INTO eu_references (
      source_type,
      source_id,
      document_id,
      provision_id,
      eu_document_id,
      eu_article,
      reference_type,
      reference_context,
      full_citation,
      is_primary_implementation,
      implementation_status
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertEuRef.run(
    'document',
    'loi-1994-02-02-1994009284-fr',
    'loi-1994-02-02-1994009284-fr',
    null,
    'regulation:2016/679',
    null,
    'supplements',
    'Mise en oeuvre nationale du RGPD',
    'Regulation (EU) 2016/679',
    1,
    'complete',
  );

  insertEuRef.run(
    'provision',
    'loi-1994-02-02-1994009284-fr:art1',
    'loi-1994-02-02-1994009284-fr',
    provisionIds.get('loi-1994-02-02-1994009284-fr:art1') ?? null,
    'regulation:2016/679',
    '6.1.e',
    'cites_article',
    'Article 1 cite l\'article 6.1.e du RGPD',
    'RGPD article 6.1.e',
    0,
    'complete',
  );

  insertEuRef.run(
    'document',
    'loi-1994-02-10-1994009323-fr',
    'loi-1994-02-10-1994009323-fr',
    null,
    'directive:95/46',
    null,
    'implements',
    'Reference historique',
    'Directive 95/46',
    1,
    'unknown',
  );

  const insertMeta = db.prepare('INSERT INTO db_metadata (key, value) VALUES (?, ?)');
  insertMeta.run('tier', 'free');
  insertMeta.run('schema_version', '1.0');
  insertMeta.run('built_at', '2026-02-16T00:00:00.000Z');
  insertMeta.run('builder', 'test-db');

  return db;
}

export function closeTestDatabase(db: InstanceType<typeof Database>): void {
  db.close();
}
