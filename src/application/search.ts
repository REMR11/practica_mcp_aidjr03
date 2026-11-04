export function normalizeSearchText(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

export function searchTokens(query: string): readonly string[] {
  const normalized = normalizeSearchText(query);
  return normalized.length === 0 ? [] : normalized.split(' ');
}

export function scoreFields(
  tokens: readonly string[],
  fields: readonly {
    readonly value: string | undefined;
    readonly weight: number;
    readonly exact?: boolean;
  }[],
): number {
  let score = 0;
  for (const field of fields) {
    if (field.value === undefined) {
      continue;
    }
    const haystack = normalizeSearchText(field.value);
    if (haystack.length === 0) {
      continue;
    }
    const matched = tokens.every((token) => haystack.includes(token));
    if (!matched) {
      continue;
    }
    score +=
      field.exact === true && haystack === tokens.join(' ') ? field.weight * 2 : field.weight;
  }
  return score;
}
