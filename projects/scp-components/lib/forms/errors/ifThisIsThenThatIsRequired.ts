export class IfThisIsThenThatIsRequiredError<TThisValue = any> {
  constructor(
    public thisField: string,
    public thisValue: TThisValue,
    public thatField: string,
    public thisValueMapper: (value: TThisValue) => any,
  ) {}
}

export function isIfThisIsThenThatIsRequiredError(
  entry: [string, any],
): entry is ['IfThisIsThenThatIsRequired', IfThisIsThenThatIsRequiredError] {
  return (
    entry[0] === 'IfThisIsThenThatIsRequired' &&
    entry[1] instanceof IfThisIsThenThatIsRequiredError
  );
}
