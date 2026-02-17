/**
 * validate_eu_compliance — Check Belgian statute's EU/retained EU law compliance status.
 */

import type { Database } from '@ansvar/mcp-sqlite';
import { generateResponseMetadata, type ToolResponse } from '../utils/metadata.js';
import { resolveExistingStatuteId } from '../utils/statute-id.js';

export interface ValidateEUComplianceInput {
  document_id: string;
  provision_ref?: string;
  eu_document_id?: string;
}

export interface EUComplianceResult {
  document_id: string;
  provision_ref?: string;
  compliance_status: 'compliant' | 'partial' | 'unclear' | 'not_applicable';
  eu_references_found: number;
  warnings: string[];
  outdated_references?: Array<{
    eu_document_id: string;
    title?: string;
    issue: string;
    replaced_by?: string;
  }>;
  recommendations?: string[];
}

export async function validateEUCompliance(
  db: Database,
  input: ValidateEUComplianceInput
): Promise<ToolResponse<EUComplianceResult>> {
  if (!input.document_id) {
    throw new Error('document_id is required');
  }

  const resolvedId = resolveExistingStatuteId(db, input.document_id);
  if (!resolvedId) {
    throw new Error(`Document "${input.document_id}" not found in database`);
  }

  let sql = `
    SELECT
      ed.id,
      ed.type,
      ed.title,
      ed.in_force,
      ed.amended_by,
      er.reference_type,
      er.is_primary_implementation,
      er.implementation_status
    FROM eu_documents ed
    JOIN eu_references er ON ed.id = er.eu_document_id
    WHERE er.document_id = ?
  `;
  const params: (string | number)[] = [resolvedId];

  if (input.eu_document_id) {
    sql += ` AND ed.id = ?`;
    params.push(input.eu_document_id);
  }

  interface Row {
    id: string;
    type: string;
    title: string | null;
    in_force: number;
    amended_by: string | null;
    reference_type: string;
    is_primary_implementation: number;
    implementation_status: string | null;
  }

  const rows = db.prepare(sql).all(...params) as Row[];

  const warnings: string[] = [];
  const outdatedReferences: Array<{
    eu_document_id: string;
    title?: string;
    issue: string;
    replaced_by?: string;
  }> = [];
  const recommendations: string[] = [];

  for (const row of rows) {
    if (row.in_force === 0) {
      const issue = `References repealed EU ${row.type} ${row.id}`;
      warnings.push(issue);

      const outdated: {
        eu_document_id: string;
        title?: string;
        issue: string;
        replaced_by?: string;
      } = {
        eu_document_id: row.id,
        issue,
      };
      if (row.title) outdated.title = row.title;

      if (row.amended_by) {
        try {
          const replacements = JSON.parse(row.amended_by) as string[];
          if (Array.isArray(replacements) && replacements.length > 0) {
            outdated.replaced_by = replacements[0];
          }
        } catch {
          // Ignore malformed replacement metadata.
        }
      }

      outdatedReferences.push(outdated);
    }

    if (row.is_primary_implementation === 1 && !row.implementation_status) {
      warnings.push(`Primary implementation of ${row.id} lacks implementation_status`);
      recommendations.push(`Add implementation_status metadata for ${row.id}`);
    }

    if (row.implementation_status === 'unknown' || row.implementation_status === 'pending') {
      warnings.push(`Implementation status for ${row.id} is "${row.implementation_status}"`);
    }
  }

  if (rows.length === 0) {
    recommendations.push(
      'No EU references found. If this statute implements EU law, consider adding EU references.'
    );
  }

  const status: EUComplianceResult['compliance_status'] =
    rows.length === 0 ? 'not_applicable' :
    outdatedReferences.length > 0 ? 'partial' :
    warnings.length > 0 ? 'unclear' :
    'compliant';

  return {
    results: {
      document_id: resolvedId,
      provision_ref: input.provision_ref,
      compliance_status: status,
      eu_references_found: rows.length,
      warnings,
      outdated_references: outdatedReferences.length > 0 ? outdatedReferences : undefined,
      recommendations: recommendations.length > 0 ? recommendations : undefined,
    },
    _metadata: generateResponseMetadata(db),
  };
}
