import { ParsedPackageVulnerability } from '../../vulnerability-scan/parsers/types';

export interface EnrichedVulnerabilityAdvisory {
  id: string;
  summary: string;
  details: string;
  references: string[];
  advisoryText: string;
}

export function normalizeOsvAdvisory(
  vulnerability: ParsedPackageVulnerability,
): EnrichedVulnerabilityAdvisory {
  const summary = vulnerability.summary?.trim() ?? '';
  const details = vulnerability.details?.trim() ?? '';
  const normalizedSummary =
    summary.length > 0 ? summary : 'No summary provided.';
  const normalizedDetails = details.length > 0 ? details : normalizedSummary;

  const references = (vulnerability.advisory ?? [])
    .map((advisory) => advisory.referenceUrl?.trim())
    .filter((value): value is string => Boolean(value && value.length > 0));

  const advisoryTextParts = [
    `Vulnerability ID: ${vulnerability.id}`,
    `Summary: ${normalizedSummary}`,
    `Details: ${normalizedDetails}`,
  ];

  if (references.length > 0) {
    advisoryTextParts.push(`References:\n${references.join('\n')}`);
  }

  return {
    id: vulnerability.id,
    summary: normalizedSummary,
    details: normalizedDetails,
    references,
    advisoryText: advisoryTextParts.join('\n\n'),
  };
}
