export type Pair = {
  ask: string
  bid: string
  baseId: string
  quoteId: string
  pairCode: string
  spread: string
}

export type priceData = { data: Pair[] }
