export class SeededRandom {

  private _seed: number

  constructor(seed: number) {
    this._seed = seed
  }

  next(min: number, max: number) {
    const x = Math.sin(this._seed++) * 10000
    const res = x - Math.floor(x)

    return Math.floor(res * (max - min + 1)) + min
  }
}
