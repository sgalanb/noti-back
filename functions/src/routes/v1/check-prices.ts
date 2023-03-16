import { Router, Request, Response } from "express"
import { db, admin } from "../../config/firebase"
import { Telegraf } from "telegraf"
import { priceData } from "../../types/beloTypes"
import { Alert } from "types"

const checkPrices = Router()

checkPrices.post("/", async (req: Request, res: Response) => {
  try {
    const priceData: priceData = await fetch("https://api.belo.app/public/price").then(res => res.json())

    const alerts = await db
      .collection("alerts")
      .get()
      .then(querySnapshot => {
        const data = querySnapshot.docs.map(doc => doc.data())
        return data as Alert[]
      })

    let notificationsSent = 0

    alerts.map(async alert => {
      const pair = priceData?.data?.find((pair: any) => pair.pairCode === alert.pairCode)
      const currentPrice: number | null =
        alert.priceType === "ask" ? Number(pair?.ask) : alert.priceType === "bid" ? Number(pair?.bid) : null
      if (!alert.triggered && alert.alertType === "rise" && currentPrice && currentPrice > alert.targetPrice) {
        await db.collection("alerts").doc(alert.alertId).update({
          triggered: true,
          triggerDate: admin.firestore.Timestamp.now(),
        })
        if (!process.env.BOT_TOKEN) {
          throw new Error("Missing bot token")
        }
        const bot = new Telegraf(process.env.BOT_TOKEN)
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
        if (!process.env.BOT_TOKEN) {
          throw new Error("Missing bot token")
        }
        const bot = new Telegraf(process.env.BOT_TOKEN)
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
          } bajó a $${alert.targetPrice} ${alert.pairCode.endsWith("ARS") ? "ARS" : "USD"} 🔹`
        )
        notificationsSent++
      }
    })
    res.json({
      status: 200,
      message: `${notificationsSent > 0 ? `Sent ${notificationsSent} notifications` : "No notifications sent"}`,
      notificationsSent,
    })
  } catch (error: any) {
    if (!process.env.ADMIN_CHAT_ID) {
      throw new Error("Missing bot token")
    }
    const bot = new Telegraf(process.env.ADMIN_CHAT_ID)
    bot.telegram.sendMessage(process.env.ADMIN_CHAT_ID, `Error en check prices: ${error}`)

    res.status(200).send({ status: 500, message: "Something went wrong", error: error })
  }
})

export { checkPrices }
