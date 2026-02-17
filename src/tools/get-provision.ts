/**
 * get_provision — Retrieve a specific provision from a Belgian statute.
 */

import type { Database } from '@ansvar/mcp-sqlite';
import { resolveExistingStatuteId } from '../utils/statute-id.js';
import { normalizeAsOfDate } from '../utils/as-of-date.js';
import { generateResponseMetadata, type ToolResponse } from '../utils/metadata.js';

export interface GetProvisionInput {
  document_id: string;
  part?: string;
  chapter?: string;
  section?: string;
  provision_ref?: string;
  as_of_date?: string;
}

export interface ProvisionResult {
  document_id: string;
  document_title: string;
  document_status: string;
  provision_ref: string;
  chapter: string | null;
  section: string;
  title: string | null;
  content: string;
  valid_from?: string | null;
  valid_to?: string | null;
}

interface ProvisionRow {
  document_id: string;
  document_title: string;
  document_status: string;
  provision_ref: string;
  chapter: string | null;
  section: string;
  title: string | null;
  content: string;
  valid_from: string | null;
  valid_to: string | null;
}

export async function getProvision(
  db: Database,
  input: GetProvisionInput
): Promise<ToolResponse<ProvisionResult | ProvisionResult[] | null>> {
  if (!input.document_id) {
    throw new Error('document_id is required');
  }

  const resolvedDocumentId = resolveExistingStatuteId(db, input.document_id) ?? input.document_id;
  const asOfDate = normalizeAsOfDate(input.as_of_date);

  const provisionRef = input.provision_ref ?? input.section;

  // If no specific provision, return all provisions for the document
  if (!provisionRef) {
    const rows = asOfDate
      ? db.prepare(`
          WITH ranked_versions AS (
            SELECT
              lpv.document_id,
              ld.title as document_title,
              ld.status as document_status,
              lpv.provision_ref,
              lpv.chapter,
              lpv.section,
              lpv.title,
              lpv.content,
              lpv.valid_from,
              lpv.valid_to,
              row_number() OVER (
                PARTITION BY lpv.document_id, lpv.provision_ref
                ORDER BY COALESCE(lpv.valid_from, '0000-01-01') DESC, lpv.id DESC
              ) as version_rank
            FROM legal_provision_versions lpv
            JOIN legal_documents ld ON ld.id = lpv.document_id
            WHERE lpv.document_id = ?
              AND (lpv.valid_from IS NULL OR lpv.valid_from <= ?)
              AND (lpv.valid_to IS NULL OR lpv.valid_to > ?)
          )
          SELECT
            document_id,
            document_title,
            document_status,
            provision_ref,
            chapter,
            section,
            title,
            content,
            valid_from,
            valid_to
          FROM ranked_versions
          WHERE version_rank = 1
          ORDER BY provision_ref
        `).all(resolvedDocumentId, asOfDate, asOfDate) as ProvisionRow[]
      : db.prepare(`
          SELECT
            lp.document_id,
            ld.title as document_title,
            ld.status as document_status,
            lp.provision_ref,
            lp.chapter,
            lp.section,
            lp.title,
            lp.content,
            NULL as valid_from,
            NULL as valid_to
          FROM legal_provisions lp
          JOIN legal_documents ld ON ld.id = lp.document_id
          WHERE lp.document_id = ?
          ORDER BY lp.id
        `).all(resolvedDocumentId) as ProvisionRow[];

    const finalRows = (asOfDate && rows.length === 0)
      ? db.prepare(`
          SELECT
            lp.document_id,
            ld.title as document_title,
            ld.status as document_status,
            lp.provision_ref,
            lp.chapter,
            lp.section,
            lp.title,
            lp.content,
            NULL as valid_from,
            NULL as valid_to
          FROM legal_provisions lp
          JOIN legal_documents ld ON ld.id = lp.document_id
          WHERE lp.document_id = ?
          ORDER BY lp.id
        `).all(resolvedDocumentId) as ProvisionRow[]
      : rows;

    return {
      results: finalRows,
      _metadata: generateResponseMetadata(db)
    };
  }

  const historicalRow = asOfDate
    ? db.prepare(`
        SELECT
          lpv.document_id,
          ld.title as document_title,
          ld.status as document_status,
          lpv.provision_ref,
          lpv.chapter,
          lpv.section,
          lpv.title,
          lpv.content,
          lpv.valid_from,
          lpv.valid_to
        FROM legal_provision_versions lpv
        JOIN legal_documents ld ON ld.id = lpv.document_id
        WHERE lpv.document_id = ?
          AND (lpv.provision_ref = ? OR lpv.section = ?)
          AND (lpv.valid_from IS NULL OR lpv.valid_from <= ?)
          AND (lpv.valid_to IS NULL OR lpv.valid_to > ?)
        ORDER BY COALESCE(lpv.valid_from, '0000-01-01') DESC, lpv.id DESC
        LIMIT 1
      `).get(resolvedDocumentId, provisionRef, provisionRef, asOfDate, asOfDate) as ProvisionRow | undefined
    : undefined;

  const row = historicalRow
    ?? db.prepare(`
      SELECT
        lp.document_id,
        ld.title as document_title,
        ld.status as document_status,
        lp.provision_ref,
        lp.chapter,
        lp.section,
        lp.title,
        lp.content,
        NULL as valid_from,
        NULL as valid_to
      FROM legal_provisions lp
      JOIN legal_documents ld ON ld.id = lp.document_id
      WHERE lp.document_id = ? AND (lp.provision_ref = ? OR lp.section = ?)
    `).get(resolvedDocumentId, provisionRef, provisionRef) as ProvisionRow | undefined;

  if (!row) {
    return {
      results: null,
      _metadata: generateResponseMetadata(db)
    };
  }

  return {
    results: row,
    _metadata: generateResponseMetadata(db)
  };
}
