export class IfIsTruthyThenIsRequiredError {
  constructor(public truthyField: string, public requiredField: string) {}
}

export function isIfIsTruthyThenIsRequiredError(
  entry: [string, any]
): entry is ['IfIsTruthyThenIsRequired', IfIsTruthyThenIsRequiredError] {
  return (
    entry[0] === 'IfIsTruthyThenIsRequired' &&
    entry[1] instanceof IfIsTruthyThenIsRequiredError
  );
}

export function isIfIsTruthyThenIsRequiredKey(
  key: string
): key is 'IfIsTruthyThenIsRequired' {
  return key === 'IfIsTruthyThenIsRequired';
}
