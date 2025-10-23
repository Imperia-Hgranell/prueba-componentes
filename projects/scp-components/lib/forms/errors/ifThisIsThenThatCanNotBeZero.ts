export class IfThisIsThenThatCanNotBeZeroError<TThisValue = any> {
  constructor(
    public thisField: string,
    public thisValue: TThisValue,
    public thatField: string,
    public thisValueMapper: (value: TThisValue) => any,
  ) {}
}

export function isIfThisIsThenThatCanNotBeZeroError(
  entry: [string, any],
): entry is [
  'IfThisIsThenThatCanNotBeZero',
  IfThisIsThenThatCanNotBeZeroError,
] {
  return (
    entry[0] === 'IfThisIsThenThatCanNotBeZero' &&
    entry[1] instanceof IfThisIsThenThatCanNotBeZeroError
  );
}

export function isIfThisIsThenThatCanNotBeZeroKey(
  key: string,
): key is 'IfThisIsThenThatCanNotBeZero' {
  return key === 'IfThisIsThenThatCanNotBeZero';
}
