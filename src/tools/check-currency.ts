/**
 * check_currency — Check if a Belgian statute is current (in force).
 */

import type { Database } from '@ansvar/mcp-sqlite';
import { normalizeAsOfDate } from '../utils/as-of-date.js';
import { generateResponseMetadata, type ToolResponse } from '../utils/metadata.js';

export interface CheckCurrencyInput {
  document_id: string;
  provision_ref?: string;
  as_of_date?: string;
}

export interface CurrencyResult {
  document_id: string;
  title: string;
  status: string;
  type: string;
  issued_date: string | null;
  in_force_date: string | null;
  is_current: boolean;
  as_of_date?: string;
  status_as_of?: 'in_force' | 'repealed' | 'not_yet_in_force';
  is_in_force_as_of?: boolean;
  provision_exists?: boolean;
  warnings: string[];
}

interface DocumentRow {
  id: string;
  title: string;
  status: string;
  type: string;
  issued_date: string | null;
  in_force_date: string | null;
}

export async function checkCurrency(
  db: Database,
  input: CheckCurrencyInput
): Promise<ToolResponse<CurrencyResult | null>> {
  if (!input.document_id) {
    throw new Error('document_id is required');
  }

  const doc = db.prepare(`
    SELECT id, title, status, type, issued_date, in_force_date
    FROM legal_documents
    WHERE id = ? OR title LIKE ?
    LIMIT 1
  `).get(input.document_id, `%${input.document_id}%`) as DocumentRow | undefined;

  if (!doc) {
    return {
      results: null,
      _metadata: generateResponseMetadata(db)
    };
  }

  const warnings: string[] = [];
  const isCurrent = doc.status === 'in_force';
  const asOfDate = normalizeAsOfDate(input.as_of_date);

  if (doc.status === 'repealed') {
    warnings.push('This statute has been repealed');
  }

  let statusAsOf: 'in_force' | 'repealed' | 'not_yet_in_force' | undefined;
  let isInForceAsOf: boolean | undefined;
  if (asOfDate) {
    const started = !doc.in_force_date || doc.in_force_date <= asOfDate;
    statusAsOf = !started ? 'not_yet_in_force' : doc.status === 'repealed' ? 'repealed' : 'in_force';
    isInForceAsOf = statusAsOf === 'in_force';

    if (doc.status === 'repealed') {
      warnings.push(
        'Historical repeal date is not tracked in this dataset; status_as_of uses current repeal status.'
      );
    }
  }

  let provisionExists: boolean | undefined;
  if (input.provision_ref) {
    const prov = asOfDate
      ? db.prepare(
          `SELECT 1
           FROM legal_provision_versions
           WHERE document_id = ?
             AND (provision_ref = ? OR section = ?)
             AND (valid_from IS NULL OR valid_from <= ?)
             AND (valid_to IS NULL OR valid_to > ?)
           LIMIT 1`
        ).get(doc.id, input.provision_ref, input.provision_ref, asOfDate, asOfDate)
      : db.prepare(
          'SELECT 1 FROM legal_provisions WHERE document_id = ? AND (provision_ref = ? OR section = ?)'
        ).get(doc.id, input.provision_ref, input.provision_ref);

    const fallbackProv = (!prov && asOfDate)
      ? db.prepare(
          'SELECT 1 FROM legal_provisions WHERE document_id = ? AND (provision_ref = ? OR section = ?)'
        ).get(doc.id, input.provision_ref, input.provision_ref)
      : prov;
    provisionExists = !!fallbackProv;

    if (!provisionExists) {
      warnings.push(`Provision "${input.provision_ref}" not found in this document`);
    }
  }

  return {
    results: {
      document_id: doc.id,
      title: doc.title,
      status: doc.status,
      type: doc.type,
      issued_date: doc.issued_date,
      in_force_date: doc.in_force_date,
      is_current: isCurrent,
      as_of_date: asOfDate,
      status_as_of: statusAsOf,
      is_in_force_as_of: isInForceAsOf,
      provision_exists: provisionExists,
      warnings,
    },
    _metadata: generateResponseMetadata(db)
  };
}
