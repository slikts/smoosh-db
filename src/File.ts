import { promises } from 'fs'
import { memoize } from 'tuplerone'

export const thenOnce = memoize(Promise.prototype.then)

type Flag = 'a' | 'ax' | 'a+' | 'as' | 'as+' | 'r' | 'r+' | 'rs+' | 'w' | 'wx' | 'w+' | 'wx+'

interface Transition<A extends State, B extends State> {
  a: A
  b: B
}
const transition = memoize(
  <A extends State, B extends State>(a: A, b: B): Transition<A, B> => ({ a, b }),
)

enum State {
  Writing,
  Idle,
  QueuedWrite,
}

const transitions = {
  idle: transition(State.Writing, State.Idle),
  queue: transition(State.Idle, State.QueuedWrite),
  write: transition(State.QueuedWrite, State.Writing),
}

type ValidTransition = typeof transitions.idle | typeof transitions.queue | typeof transitions.write

class File<A extends State> {
  state: A = State.Idle

  constructor(readonly name: string, readonly handle: promises.FileHandle) {
    this.name = name
    this.handle = handle
  }

  update<A extends State, B extends State>(to: B): this {
    // const t = transition(this.state, to)
    // switch (t) {
    //   case transitions.idle:
    // }
    return this
  }
}

export const open = async (
  name: string,
  flags: Flag,
  mode?: string | number,
): Promise<File<State.Idle>> => {
  const handle = await promises.open(name, flags, mode)
  return new File(name, handle)
}
