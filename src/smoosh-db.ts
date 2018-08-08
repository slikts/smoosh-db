import { deepProxy } from '@slikts/deepproxy'
import { memoize } from 'tuplerone'
import { promises } from 'fs'

export const thenOnce = memoize(Promise.prototype.then)
const encoding = 'utf8'

const read = async <A>(fileHandle: promises.FileHandle, init: () => A): Promise<A> => {
  const fileContent = await fileHandle.readFile({ encoding })
  return fileContent.trim() ? JSON.parse(fileContent) : init()
}

const write = async (
  fileHandle: promises.FileHandle,
  value: any,
  replacer: any = null,
): Promise<void> => {
  await fileHandle.truncate()
  await fileHandle.writeFile(JSON.stringify(value, replacer, 2), { encoding })
}

export const liveJSON = async <A extends object>(
  fileName: string,
  init: () => A,
  fs = promises,
  replacer: any = null,
): Promise<A> => {
  const fileHandle = await fs.open(fileName, 'a+')
  const root = await read(fileHandle, init)
  let status: Promise<void> | null = null
  const update = async (): Promise<void> => {
    // Set status to writing so that changes would trigger a new update
    status = write(fileHandle, root, replacer)
    await status
    // Clear status after writing
    status = null
  }
  const delayedUpdate = (): void => {
    if (status === null) {
      // Make it wait until the next task to start writing
      status = Promise.resolve()
    }
    // Only write once per status
    thenOnce.call(status, update)
  }
  return deepProxy(root, {
    set(target: any, key, value) {
      if (target[key] === value) {
        return true
      }
      target[key] = value
      delayedUpdate()
      return true
    },
    deleteProperty(target, key) {
      if (!Object.prototype.hasOwnProperty.call(target, key)) {
        return true
      }
      delete target[key]
      delayedUpdate()
      return true
    },
  })
}
