export class EqualsError {
  constructor(public fields: string[]) {}
}

export function isEqualsError(
  entry: [string, any],
): entry is ['Equals', EqualsError] {
  return entry[0] === 'Equals' && entry[1] instanceof EqualsError;
}
