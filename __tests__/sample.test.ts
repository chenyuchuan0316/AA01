import fs from 'node:fs';

let formFixture: Record<string, string>;

beforeAll(() => {
  const fixtureUrl = new URL('./fixtures/basic-form.json', import.meta.url);
  const contents = fs.readFileSync(fixtureUrl, 'utf-8');
  formFixture = JSON.parse(contents);
});

describe('baseline fixture validation', () => {
  it('provides minimal form data for smoke tests', () => {
    expect(formFixture).toMatchObject({
      unitCode: expect.any(String),
      caseManagerName: expect.any(String),
      caseName: expect.any(String),
      consultName: expect.any(String)
    });
  });
});
