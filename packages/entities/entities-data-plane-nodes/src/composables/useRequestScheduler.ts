export type RequestSchedulerOptions = {
  maxConcurrentRequests: number,
}

type ReturnTokenFunction = () => void
type TokenBorrowQueueItem = [
  (returnToken: ReturnTokenFunction) => void, // resolve function
  (reason: unknown) => void, // reject (cancel) function
]

class TokenBucket {
  private concurrentTokenSet: Set<Symbol> = new Set()
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
      this.concurrentTokenSet.delete(token)
      return () => {
        this.returnConcurrentToken(token)
      }
    }
    throw new Error('BUG: No available token to borrow')
  }

  private returnConcurrentToken(token: Symbol) {
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

export class RequestAbortException extends Error {
  constructor(message?: string, options?: ErrorOptions) {
    super(message, options)
    this.name = 'RequestAbortException'
  }
}

export class RequestScheduler {
  private tokenBucket: TokenBucket

  constructor(opt: RequestSchedulerOptions) {
    this.tokenBucket = new TokenBucket(opt.maxConcurrentRequests)
  }

  schedule = async <T>(requestInitiator: () => Promise<T>): Promise<T> => {
    const returnToken = await this.tokenBucket.borrowToken()
    try {
      const resp = await requestInitiator()
      returnToken()
      return resp
    } catch (e) {
      returnToken()
      throw e
    }
  }

  cancelAll = (message?: string, options?: ErrorOptions) => {
    this.tokenBucket.clearWaitingQueue(new RequestAbortException(message, options))
  }
}

export const useRequestScheduler = (opt: RequestSchedulerOptions) => new RequestScheduler(opt)
