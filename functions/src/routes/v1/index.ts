import { Router } from "express"
import { telegramInput } from "./telegram-input"
import { alerts } from "./alerts"
import { checkPrices } from "./check-prices"

const v1 = Router()

v1.use("/check-prices", checkPrices)
v1.use("/alerts", alerts)
v1.use("/telegram-input", telegramInput)

export { v1 }
