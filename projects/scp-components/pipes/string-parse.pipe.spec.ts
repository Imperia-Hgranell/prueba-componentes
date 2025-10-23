import { StringParsePipe } from './string-parse.pipe';

describe('StringParsePipe', () => {
  it('create an instance', () => {
    const pipe = new StringParsePipe();
    expect(pipe).toBeTruthy();
  });
});
