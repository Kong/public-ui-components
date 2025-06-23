type ReturnTokenFunction = () => void
type TokenBorrowQueueItem = [
  (returnToken: ReturnTokenFunction) => void, // resolve function
  (reason: unknown) => void, // reject (cancel) function
]

class TokenBucket {
  private concurrentTokenSet: Set<symbol> = new Set()
  private concurrentTokenBorrowQueue: TokenBorrowQueueItem[] = []

  constructor(capacity: number) {
    for (let i = 0; i < capacity; ++i) {
      this.concurrentTokenSet.add(Symbol(`token-${i}`))
    }
  }

  private hasAvailableConcurrentToken() {
    return this.concurrentTokenSet.size > 0
  }

  private borrowConcurrentToken() {
    if (this.concurrentTokenSet.size > 0) {
      const token = this.concurrentTokenSet.values().next().value
      if (token) {
        this.concurrentTokenSet.delete(token)
        return () => {
          this.returnConcurrentToken(token)
        }
      }
    }
    throw new Error('BUG: No available token to borrow')
  }

  private returnConcurrentToken(token: symbol) {
    if (this.concurrentTokenSet.has(token)) {
      throw new Error('Token already returned')
    }

    const next = this.concurrentTokenBorrowQueue.shift()
    if (next) {
      next[0](() => this.returnConcurrentToken(token))
    } else {
      this.concurrentTokenSet.add(token)
    }
  }

  async borrowToken() {
    if (this.hasAvailableConcurrentToken()) {
      return this.borrowConcurrentToken()
    }

    return new Promise<ReturnTokenFunction>((resolve, reject) => {
      this.concurrentTokenBorrowQueue.push([resolve, reject])
    })
  }

  clearWaitingQueue(reason: unknown) {
    while (this.concurrentTokenBorrowQueue.length > 0) {
      const [, reject] = this.concurrentTokenBorrowQueue.shift()!
      reject(reason)
    }
  }
}

export class AsyncAbortException extends Error {
  constructor(message?: string, options?: ErrorOptions) {
    super(message, options)
    this.name = 'AsyncAbortException'
  }
}

export type AsyncSchedulerOptions = {
  maxConcurrentAsyncs: number
}

export class AsyncScheduler {
  private tokenBucket: TokenBucket | null = null

  constructor(opt: AsyncSchedulerOptions) {
    if (opt.maxConcurrentAsyncs > 0) {
      this.tokenBucket = new TokenBucket(opt.maxConcurrentAsyncs)
    }
  }

  schedule = async <T>(asyncInitiator: () => Promise<T>): Promise<T> => {
    let returnToken: ReturnTokenFunction | undefined
    if (this.tokenBucket) {
      returnToken = await this.tokenBucket.borrowToken()
    }
    try {
      const resp = await asyncInitiator()
      returnToken?.()
      return resp
    } catch (e) {
      returnToken?.()
      throw e
    }
  }

  cancelAll = (message?: string, options?: ErrorOptions) => {
    this.tokenBucket?.clearWaitingQueue(new AsyncAbortException(message, options))
  }
}

export const useAsyncScheduler = (opt: AsyncScheduler | AsyncSchedulerOptions | null) => {
  if (opt instanceof AsyncScheduler) {
    return opt
  } else if (opt === null) {
    return new AsyncScheduler({ maxConcurrentAsyncs: 0 })
  } else {
    return new AsyncScheduler(opt)
  }
}
