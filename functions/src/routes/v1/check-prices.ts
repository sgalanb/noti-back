import { Router, Request, Response } from "express"
import { db, admin } from "../../config/firebase"
import { Telegraf } from "telegraf"
import { Alert } from "types"
import config from "../../config/env"
import { Pair } from "beloTypes"

const TG_BOT_TOKEN = config.TG_BOT_TOKEN as string
const ADMIN_CHAT_ID = config.ADMIN_CHAT_ID as string

const checkPrices = Router()

checkPrices.post("/", async (req: Request, res: Response) => {
  try {
    const priceData = await fetch("https://api.belo.app/public/price").then(res => res.json())

    const alerts = await db
      .collection("alerts")
      .get()
      .then(querySnapshot => {
        const data = querySnapshot.docs.map(doc => doc.data())
        return data as Alert[]
      })

    let notificationsSent = 0

    alerts.map(async alert => {
      const pair = priceData?.find((pair: Pair) => pair.pairCode === alert.pairCode)
      const currentPrice: number | null =
        alert.priceType === "ask" ? Number(pair?.ask) : alert.priceType === "bid" ? Number(pair?.bid) : null
      if (!alert.triggered && alert.alertType === "rise" && currentPrice && currentPrice > alert.targetPrice) {
        await db.collection("alerts").doc(alert.alertId).update({
          triggered: true,
          triggerDate: admin.firestore.Timestamp.now(),
        })
        if (!TG_BOT_TOKEN) {
          throw new Error("Missing bot token")
        }
        const bot = new Telegraf(TG_BOT_TOKEN)
        bot.telegram.sendMessage(
          alert.chatId,
          `🔹 ${
            alert.pairCode.startsWith("BTC")
              ? "Bitcoin(BTC)"
              : alert.pairCode.startsWith("ETH")
              ? "Ethereum(ETH)"
              : alert.pairCode.startsWith("USDC")
              ? "USDC"
              : alert.pairCode.startsWith("USDT")
              ? "USDT"
              : alert.pairCode.startsWith("DAI")
              ? "DAI"
              : "ARS"
          } subió a $${alert.targetPrice} ${alert.pairCode.endsWith("ARS") ? "ARS" : "USD"} 🔹`
        )
        notificationsSent++
      }
      if (!alert.triggered && alert.alertType === "fall" && currentPrice && currentPrice < alert.targetPrice) {
        await db.collection("alerts").doc(alert.alertId).update({
          triggered: true,
          triggerDate: admin.firestore.Timestamp.now(),
        })
        if (!TG_BOT_TOKEN) {
          throw new Error("Missing bot token")
        }
        notificationsSent++
        const bot = new Telegraf(TG_BOT_TOKEN)
        bot.telegram.sendMessage(
          alert.chatId,
          `🔻 ${
            alert.pairCode.startsWith("BTC")
              ? "Bitcoin(BTC)"
              : alert.pairCode.startsWith("ETH")
              ? "Ethereum(ETH)"
              : alert.pairCode.startsWith("USDC")
              ? "USDC"
              : alert.pairCode.startsWith("USDT")
              ? "USDT"
              : alert.pairCode.startsWith("DAI")
              ? "DAI"
              : "ARS"
          } bajó a $${alert.targetPrice} ${alert.pairCode.endsWith("ARS") ? "ARS" : "USD"} 🔻`
        )
      }
    })
    res.json({
      status: 200,
      message: `${notificationsSent > 0 ? `Sent ${notificationsSent} notifications` : "No notifications sent"}`,
    })
  } catch (error: any) {
    if (!ADMIN_CHAT_ID) {
      throw new Error("Missing bot token")
    }
    const bot = new Telegraf(ADMIN_CHAT_ID)
    bot.telegram.sendMessage(ADMIN_CHAT_ID, `Error en check prices: ${error}`)

    res.status(200).send({ status: 500, message: "Something went wrong", error: error })
  }
})

export { checkPrices }
