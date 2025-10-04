import { COMMON_MESSAGES } from '../../messages';
import { template } from '../../utils';
import type {
  ExecutionResult,
  QueryResult,
  Utils,
  ValidationResult,
  VerificationResult,
} from '../../types';
import { schemas } from '../../../database/schemas';

// ============================================================================
// DATA EXTRACTION
// ============================================================================

interface CompanyRow {
  id: number;
  company_name: string;
  country: string;
  founded_year: number | null;
  num_employees: number | null;
  industry: string | null;
}

const COMPANY_DATA: CompanyRow[] = parseCompaniesSchema(schemas.companies);

const COUNTRY_COUNTS = aggregateCounts(COMPANY_DATA.map((row) => row.country));
const LETTER_COUNTS = aggregateCounts(
  COMPANY_DATA
    .map((row) => row.company_name?.[0]?.toUpperCase() || '')
    .filter((letter) => letter.length === 1 && /[A-Z]/.test(letter)),
);

const COUNTRY_OPTIONS = Object.keys(COUNTRY_COUNTS).sort();
const LETTER_OPTIONS = Object.keys(LETTER_COUNTS).sort();

const REQUIRED_COLUMNS = ['id', 'company_name', 'country', 'founded_year', 'num_employees', 'industry'];

// ============================================================================
// MESSAGES - All user-facing text
// ============================================================================

export const MESSAGES = {
  descriptions: {
    'filter-by-country': 'Find all companies from {country}.',
    'filter-with-pattern': 'Find all companies whose name starts with {letter}.',
  },
  validation: {
    ...COMMON_MESSAGES.validation,
    noResults: 'Query executed but returned no results.',
    wrongStructure: 'Query result has invalid structure.',
    missingColumns: 'Query should select all columns (use SELECT *).',
  },
  verification: {
    ...COMMON_MESSAGES.verification,
    correct: 'Perfect! Your query correctly filters the data.',
    wrongRowCount: 'Expected {expected} rows but got {actual}.',
    wrongValues: "Returned rows don't match the expected set.",
  },
} as const;

// ============================================================================
// TYPES - Exercise-specific state
// ============================================================================

export interface FilterRowsState {
  id: 'filter-by-country' | 'filter-with-pattern';
  type: 'country' | 'pattern';
  value: string;
}

export interface ExerciseState {
  id: FilterRowsState['id'];
  description: string;
  state: FilterRowsState;
}

// ============================================================================
// GENERATOR - Create new exercise instances
// ============================================================================

export function generate(utils: Utils): ExerciseState {
  const availableTypes: Array<FilterRowsState['type']> = [];

  if (COUNTRY_OPTIONS.length > 0) availableTypes.push('country');
  if (LETTER_OPTIONS.length > 0) availableTypes.push('pattern');

  const type = availableTypes.length > 0 ? utils.selectRandomly(availableTypes as readonly FilterRowsState['type'][])
    : 'country';

  if (type === 'country' && COUNTRY_OPTIONS.length > 0) {
    const country = utils.selectRandomly(COUNTRY_OPTIONS as readonly string[]);
    return {
      id: 'filter-by-country',
      description: template(MESSAGES.descriptions['filter-by-country'], { country }),
      state: {
        id: 'filter-by-country',
        type,
        value: country,
      },
    };
  }

  const letter = LETTER_OPTIONS.length > 0
    ? utils.selectRandomly(LETTER_OPTIONS as readonly string[])
    : 'A';

  return {
    id: 'filter-with-pattern',
    description: template(MESSAGES.descriptions['filter-with-pattern'], { letter }),
    state: {
      id: 'filter-with-pattern',
      type: 'pattern',
      value: letter,
    },
  };
}

// ============================================================================
// VALIDATOR - Check execution result structure (NOT input)
// ============================================================================

export function validateOutput(
  _exercise: ExerciseState,
  result: ExecutionResult<QueryResult[]>,
): ValidationResult {
  if (!result.success) {
    return {
      ok: false,
      message: template(MESSAGES.validation.syntaxError, {
        error: result.error?.message || 'Unknown error',
      }),
    };
  }

  const output = result.output;

  if (!output || output.length === 0) {
    return {
      ok: false,
      message: MESSAGES.validation.noResults,
    };
  }

  const firstResult = output[0];

  if (!firstResult || !Array.isArray(firstResult.columns) || !Array.isArray(firstResult.values)) {
    return {
      ok: false,
      message: MESSAGES.validation.wrongStructure,
    };
  }

  const hasRequiredColumns = REQUIRED_COLUMNS.every((column) => firstResult.columns.includes(column));

  if (!hasRequiredColumns) {
    return {
      ok: false,
      message: MESSAGES.validation.missingColumns,
    };
  }

  return { ok: true };
}

// ============================================================================
// VERIFIER - Check if output is correct
// ============================================================================

export function verifyOutput(
  exercise: ExerciseState,
  output: QueryResult[] | undefined,
): VerificationResult {
  const result = output?.[0];

  if (!result) {
    return {
      correct: false,
      message: MESSAGES.validation.noResults,
    };
  }

  const { state } = exercise;
  const expectedRows = getExpectedRows(state);
  const actualRows = Array.isArray(result.values) ? result.values : [];

  if (actualRows.length !== expectedRows.length) {
    return {
      correct: false,
      message: template(MESSAGES.verification.wrongRowCount, {
        expected: expectedRows.length,
        actual: actualRows.length,
      }),
    };
  }

  const idIndex = result.columns.indexOf('id');
  const countryIndex = result.columns.indexOf('country');
  const nameIndex = result.columns.indexOf('company_name');

  if (idIndex === -1 || countryIndex === -1 || nameIndex === -1) {
    return {
      correct: false,
      message: MESSAGES.validation.missingColumns,
    };
  }

  const expectedIdSet = new Set(expectedRows.map((row) => row.id));
  const actualIdSet = new Set<number>();

  for (const row of actualRows) {
    const rawId = row?.[idIndex];
    const id = typeof rawId === 'number' ? rawId : Number(rawId);
    if (!Number.isFinite(id)) {
      return {
        correct: false,
        message: MESSAGES.verification.wrongValues,
      };
    }

    actualIdSet.add(id);

    if (state.type === 'country') {
      if (row?.[countryIndex] !== state.value) {
        return {
          correct: false,
          message: MESSAGES.verification.wrongValues,
        };
      }
    } else if (state.type === 'pattern') {
      const companyName = String(row?.[nameIndex] ?? '');
      if (!companyName.startsWith(state.value)) {
        return {
          correct: false,
          message: MESSAGES.verification.wrongValues,
        };
      }
    }
  }

  const allExpectedSeen = expectedRows.every((row) => actualIdSet.has(row.id));
  const noUnexpectedRows = [...actualIdSet].every((id) => expectedIdSet.has(id));

  if (!allExpectedSeen || !noUnexpectedRows) {
    return {
      correct: false,
      message: MESSAGES.verification.wrongValues,
    };
  }

  return {
    correct: true,
    message: MESSAGES.verification.correct,
  };
}

// ============================================================================
// SOLUTION PROVIDER
// ============================================================================

export function getSolution(exercise: ExerciseState): string {
  const { type, value } = exercise.state;

  if (type === 'country') {
    return `SELECT * FROM companies WHERE country = '${value}'`;
  }

  return `SELECT * FROM companies WHERE company_name LIKE '${value}%'`;
}

// ============================================================================
// HELPERS (private)
// ============================================================================

function parseCompaniesSchema(schemaSql: string): CompanyRow[] {
  const insertMatch = schemaSql.match(/INSERT\s+INTO\s+companies\s+VALUES\s+([\s\S]*?);/i);
  if (!insertMatch) return [];

  const tuplesSegment = insertMatch[1];
  const tupleRegex = /\(([^()]+)\)/g;
  const rows: CompanyRow[] = [];
  let match: RegExpExecArray | null;

  while ((match = tupleRegex.exec(tuplesSegment)) !== null) {
    const tupleValues = parseTuple(match[1]);
    if (tupleValues.length < 6) continue;

    const [id, companyName, country, foundedYear, numEmployees, industry] = tupleValues;

    rows.push({
      id: toNumber(id),
      company_name: companyName,
      country,
      founded_year: toNumberOrNull(foundedYear),
      num_employees: toNumberOrNull(numEmployees),
      industry: industry || null,
    });
  }

  return rows;
}

function parseTuple(tuple: string): string[] {
  const values: string[] = [];
  let current = '';
  let inString = false;

  for (let i = 0; i < tuple.length; i += 1) {
    const char = tuple[i];

    if (char === "'" && tuple[i - 1] !== '\\') {
      inString = !inString;
      continue;
    }

    if (char === ',' && !inString) {
      values.push(normalizeLiteral(current));
      current = '';
      continue;
    }

    current += char;
  }

  if (current.trim().length > 0) {
    values.push(normalizeLiteral(current));
  }

  return values;
}

function normalizeLiteral(raw: string): string {
  const trimmed = raw.trim();
  if (/^'.*'$/.test(trimmed)) {
    return trimmed.slice(1, -1);
  }
  if (trimmed.toUpperCase() === 'NULL') {
    return '';
  }
  return trimmed;
}

function toNumber(value: string): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function toNumberOrNull(value: string): number | null {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function aggregateCounts(values: string[]): Record<string, number> {
  return values.reduce<Record<string, number>>((acc, value) => {
    if (!value) return acc;
    acc[value] = (acc[value] ?? 0) + 1;
    return acc;
  }, {});
}

function getExpectedRows(state: FilterRowsState): CompanyRow[] {
  if (COMPANY_DATA.length === 0) return [];

  if (state.type === 'country') {
    return COMPANY_DATA.filter((row) => row.country === state.value);
  }

  const prefix = state.value;
  return COMPANY_DATA.filter((row) => row.company_name.startsWith(prefix));
}
