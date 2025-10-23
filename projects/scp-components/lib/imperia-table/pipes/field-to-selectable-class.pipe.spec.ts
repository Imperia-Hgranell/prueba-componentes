import { FieldToImperiaTableColumnClassPipe } from './field-to-selectable-class.pipe';

describe('FieldToSelectableClassPipe', () => {
  it('create an instance', () => {
    const pipe = new FieldToImperiaTableColumnClassPipe();
    expect(pipe).toBeTruthy();
  });
});
