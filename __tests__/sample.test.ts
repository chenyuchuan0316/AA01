import formFixture from './fixtures/basic-form.json';

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
