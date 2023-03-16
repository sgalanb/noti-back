import { Router } from "express"
import { alerts } from "./alerts"
import { checkPrices } from "./check-prices"

const v1 = Router()

v1.use("/check-prices", checkPrices)
v1.use("/alerts", alerts)

export { v1 }
