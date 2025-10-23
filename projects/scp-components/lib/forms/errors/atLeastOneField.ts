export class atLeastOneFieldError {
  constructor(public fields: string[]) {}
}

export function isAtLeastOneFieldError(
  entry: [string, any],
): entry is ['atLeastOneField', atLeastOneFieldError] {
  return (
    entry[0] === 'atLeastOneField' && entry[1] instanceof atLeastOneFieldError
  );
}

export function isAtLeastOneFieldKey(
  key: string,
): key is 'atLeastOneFieldError' {
  return key === 'atLeastOneFieldError';
}
