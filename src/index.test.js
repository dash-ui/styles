const hello = world => `hello ${world}`

test('passes', () => {
  expect(hello('world')).toMatchSnapshot()
})
