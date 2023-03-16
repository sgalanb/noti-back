import { admin } from "../config/firebase"

export type Alert = {
  alertId: string
  alertType: string
  creationDate: admin.firestore.Timestamp
  pairCode: string
  priceType: string
  targetPrice: number
  priceAtCreation: number
  triggered: boolean
  userHandle: string
  chatId: string
  name: string
  lastName: string
}
