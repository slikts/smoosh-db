import { thenOnce } from '../src/smoosh-db'

describe('helpers', () => {
  it('thenOnce thens only once', async () => {
    const p = Promise.resolve()
    const f = () => Symbol()
    expect(await thenOnce.call(p, f)).toBe(await thenOnce.call(p, f))
  })
})
