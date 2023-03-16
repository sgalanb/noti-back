import { admin, db } from "../../config/firebase"
import { Router, Request, Response } from "express"

const alerts = Router()

alerts.get("/", async (req: Request, res: Response) => {
  try {
    const chatId: number = Number(req.query.chatId)

    const data = await db
      .collection("alerts")
      .where("chatId", "==", chatId)
      .get()
      .then(querySnapshot => {
        const data = querySnapshot.docs.map(doc => doc.data())
        return data.sort((a: any, b: any) => {
          return a.creationDate.seconds - b.creationDate.seconds
        })
      })
      .catch(error => {
        console.log("Error getting documents: ", error)
      })
    res.status(200).send({ status: 200, message: "Alerts", data: data })
  } catch (error: any) {
    res.status(200).send({ status: 500, message: "Error getting alerts", error })
  }
})

alerts.post("/create", async (req: Request, res: Response) => {
  try {
    const db = admin.firestore()
    const pairCodes = [
      "BTC/ARS",
      "ETH/ARS",
      "DAI/ARS",
      "USDT/ARS",
      "USDC/ARS",
      "BTC/ETH",
      "BTC/DAI",
      "BTC/USDT",
      "BTC/USDC",
      "ETH/DAI",
      "ETH/USDT",
      "ETH/USDC",
      "DAI/USDT",
      "DAI/USDC",
      "USDT/USDC",
    ]

    const body = req.body
    if (
      (body.alertType === "rise" || body.alertType === "fall") &&
      (body.priceType === "ask" || body.priceType === "bid") &&
      body.targetPrice &&
      typeof body.targetPrice === "number" &&
      body.targetPrice > 0 &&
      body.priceAtCreation &&
      typeof body.priceAtCreation === "number" &&
      body.priceAtCreation > 0 &&
      body.pairCode &&
      typeof body.pairCode === "string" &&
      body.chatId &&
      typeof body.chatId === "number" &&
      body.name &&
      typeof body.name === "string" &&
      body.lastName &&
      typeof body.lastName === "string" &&
      pairCodes.includes(body.pairCode)
    ) {
      const newDoc = db.collection("alerts").doc()
      newDoc
        .set({
          ...req.body,
          creationDate: admin.firestore.Timestamp.now(),
          triggered: false,
          alertId: newDoc.id,
        })
        .then(() => {
          res.status(200).send({ status: 200, message: "Alert created" })
        })
    } else {
      res.status(200).send({ status: 400, message: "Something went wrong." })
    }

    // Missing fields
    if (!body.alertType) {
      res.status(200).send({ status: 400, message: "Missing alert type" })
    }
    if (!body.priceType) {
      res.status(200).send({ status: 400, message: "Missing price type" })
    }
    if (!body.targetPrice) {
      res.status(200).send({ status: 400, message: "Missing target price" })
    }
    if (!body.priceAtCreation) {
      res.status(200).send({ status: 400, message: "Missing price at creation" })
    }
    if (!body.pairCode) {
      res.status(200).send({ status: 400, message: "Missing pair code" })
    }
    if (!body.chatId) {
      res.status(200).send({ status: 400, message: "Missing chatId" })
    }
    if (!body.name) {
      res.status(200).send({ status: 400, message: "Missing name" })
    }
    if (!body.lastName) {
      res.status(200).send({ status: 400, message: "Missing lastName" })
    }

    // Invalid fields
    if (body.alertType !== "rise" && body.alertType !== "fall") {
      res.status(200).send({ status: 400, message: "Invalid alert type" })
    }
    if (body.priceType !== "ask" && body.priceType !== "bid") {
      res.status(200).send({ status: 400, message: "Invalid price type" })
    }
    if (typeof body.targetPrice !== "number" || body.targetPrice <= 0) {
      res.status(200).send({ status: 400, message: "Invalid target price" })
    }
    if (typeof body.priceAtCreation !== "number" || body.priceAtCreation <= 0) {
      res.status(200).send({ status: 400, message: "Invalid price at creation" })
    }
    if (!pairCodes.includes(body.pairCode)) {
      res.status(200).send({ status: 400, message: "Invalid pair code" })
    }
    if (typeof body.chatId !== "string") {
      res.status(200).send({ status: 400, message: "Invalid chatId" })
    }
    if (typeof body.name !== "string") {
      res.status(200).send({ status: 400, message: "Invalid name" })
    }
    if (typeof body.lastName !== "string") {
      res.status(200).send({ status: 400, message: "Invalid lastName" })
    }
    // userHandle is optional because an account can be used without a handle
  } catch (error: any) {
    res.status(200).send({ status: 500, message: "Something went wrong", error: error })
  }
})

alerts.delete("/delete", async (req: Request, res: Response) => {
  try {
    const alertId = req.query.alertId
    if (alertId && typeof alertId === "string") {
      db.collection("alerts")
        .doc(alertId)
        .delete()
        .then(() => {
          res.status(200).send({ status: 200, message: "Alert deleted" })
        })
    } else {
      res.status(200).send({ status: 400, message: "Missing alert id" })
    }
  } catch (error: any) {
    res.status(200).send({ status: 500, message: "Something went wrong", error: error })
  }
})

export { alerts }
