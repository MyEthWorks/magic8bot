import { loadStrategy } from '@plugins'
import { PeriodStore } from '@stores'

interface LegacyStrategy {
  name: string
  description: string
  getOptions: () => void
  calculate: (s: any) => void
  onPeriod: (s: any, cb: any) => void
  onReport: (s: any) => any[]
}

interface LocalState {
  period: Record<string, any>
  lookback: Record<string, any>[]
  options: Record<string, any>
  signal: 'buy' | 'sell'
}

export class LegacyStrategyService {
  private readonly strategy: LegacyStrategy
  private readonly periodStore: PeriodStore

  private lastSignal: 'buy' | 'sell' = null

  private localState: LocalState = {
    lookback: [],
    options: {},
    period: {},
    signal: null,
  }

  constructor(strategyName: string, period: string) {
    this.strategy = loadStrategy(strategyName)
    this.periodStore = new PeriodStore(period)
  }

  get name() {
    return this.strategy.name
  }

  get description() {
    return this.strategy.description
  }

  public getOptions() {
    return this.strategy.getOptions()
  }

  public async calculate() {
    this.strategy.calculate(this.localState)

    // this will calculate signal on every update
    await new Promise((resolve) => this.strategy.onPeriod(this.localState, resolve))

    if (this.localState.signal && this.localState.signal !== this.lastSignal) {
      this.lastSignal = this.localState.signal
    }
  }

  public onPeriod() {
    this.localState.lookback.unshift(this.localState.period)
    this.localState.period = this.periodStore.periods[0]
    this.localState.signal = null
  }

  public async onReport() {
    return this.strategy.onReport(this.localState)
  }
}