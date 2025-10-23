import { ImperiaTableColumn } from '../../imperia-table/models/imperia-table-columns.models';

export enum CanNotBeLessGreaterComparation {
  LessThan = 'LessThan',
  GreaterThan = 'GreaterThan',
}
export enum CanNotBeLessGreaterType {
  DatesCanNotBe = 'DatesCanNotBe',
  NumbersCanNotBe = 'NumbersCanNotBe',
}
export type CanNotBeLessGreaterKey =
  `${CanNotBeLessGreaterType}${CanNotBeLessGreaterComparation}`;

export interface CanNotBeLessGreaterErrorTranslation {
  dates: {
    GreaterThan: string;
    LessThan: string;
  };
  numbers: {
    GreaterThan: string;
    LessThan: string;
  };
}

export class CanNotBeLessGreaterError {
  constructor(
    public lessGreaterField: string,
    public lessGreaterValue: string,
    public thanField: string,
    public thanValue: string,
    public type: CanNotBeLessGreaterType,
    public comparation: CanNotBeLessGreaterComparation
  ) {}

  public getErrorMessageTranslated(
    translation: CanNotBeLessGreaterErrorTranslation,
    columnsOrFields: ImperiaTableColumn<any>[]
  ) {
    const lessGreaterTranslated = this.getTranslationForField(
      'lessGreater',
      columnsOrFields
    );
    const thanTranslated = this.getTranslationForField('than', columnsOrFields);
    return translation[
      this.type == CanNotBeLessGreaterType.NumbersCanNotBe ? 'numbers' : 'dates'
    ][this.comparation]
      .replace(/{{lessGreaterField}}/g, lessGreaterTranslated)
      .replace(/{{lessGreaterValue}}/g, this.lessGreaterValue)
      .replace(/{{thanField}}/g, thanTranslated)
      .replace(/{{thanValue}}/g, this.thanValue);
  }

  private getTranslationForField(
    field: 'lessGreater' | 'than',
    columnsOrFields: ImperiaTableColumn<any>[]
  ) {
    const columnOrField = columnsOrFields.find(
      (c) => c.field === this[`${field}Field`]
    );
    if (!columnOrField) return this[`${field}Field`];
    return columnOrField.header;
  }
}

export function isCanNotBeLessGreaterError(
  entry: [string, any]
): entry is [CanNotBeLessGreaterKey, CanNotBeLessGreaterError] {
  return (
    isCanNotBeLessGreaterKey(entry[0]) &&
    entry[1] instanceof CanNotBeLessGreaterError
  );
}

function isCanNotBeLessGreaterKey(key: string): key is CanNotBeLessGreaterKey {
  return new RegExp(
    `^(${CanNotBeLessGreaterType.DatesCanNotBe}|${CanNotBeLessGreaterType.NumbersCanNotBe})(${CanNotBeLessGreaterComparation.LessThan}|${CanNotBeLessGreaterComparation.GreaterThan})$`
  ).test(key);
}
