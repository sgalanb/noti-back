import { Markup, Scenes } from "telegraf"
import { Pair } from "../types/beloTypes"
import config from "../config/env"

const ADMIN_CHAT_ID = config.ADMIN_CHAT_ID as string

const dolar = new Scenes.WizardScene(
  "dolar",
  async (ctx: any) => {
    await ctx.reply(
      `
💵 *Nueva alerta dólar*
Elegí una stablecoin a monitorear:
        `,
      {
        parse_mode: "markdown",
        ...Markup.inlineKeyboard([
          Markup.button.callback("USDC", "usdc"),
          Markup.button.callback("USDT", "usdt"),
          Markup.button.callback("DAI", "dai"),
        ]),
      }
    )
    ctx.wizard.state.messageToEdit = ctx.message?.message_id
    return ctx.wizard.next()
  },
  async (ctx: any) => {
    if (
      ctx?.callbackQuery?.data === "usdc" ||
      ctx?.callbackQuery?.data === "usdt" ||
      ctx?.callbackQuery?.data === "dai"
    ) {
      await ctx.answerCbQuery()

      ctx.wizard.state.messageToEdit = ctx.callbackQuery.message?.message_id

      const selectedStablecoin = ctx.callbackQuery.data
      ctx.wizard.state.stablecoin = selectedStablecoin

      await ctx.editMessageText(
        `
💵 *Nueva alerta dólar*
Stablecoin: *${selectedStablecoin === "usdc" ? "USDC" : selectedStablecoin === "usdt" ? "USDT" : "DAI"}*
Qué tipo de cotización te interesa?
        `,
        {
          parse_mode: "markdown",
          ...Markup.inlineKeyboard([
            [Markup.button.callback("Compra", "ask")],
            [Markup.button.callback("Venta", "bid")],
          ]),
        }
      )
      return ctx.wizard.next()
    } else if (ctx.message?.text === "/misalertas" || ctx.message?.text === "/alerta") {
      try {
        await ctx.telegram.deleteMessage(ctx.chat.id, ctx.wizard.state.messageToEdit + 1)
        await ctx.telegram.deleteMessage(ctx.chat.id, ctx.wizard.state.messageToEdit)
      } catch (error) {}
      await ctx.scene.leave()
      return ctx.scene.enter(ctx.message?.text.replace("/", ""))
    } else {
      return ctx.deleteMessage()
    }
  },
  async (ctx: any) => {
    if (ctx?.callbackQuery?.data === "ask" || ctx?.callbackQuery?.data === "bid") {
      await ctx.answerCbQuery()

      ctx.wizard.state.messageToEdit = ctx.callbackQuery.message?.message_id

      const selectedStablecoin = ctx.wizard.state.stablecoin

      const selectedPriceType = ctx.callbackQuery.data
      ctx.wizard.state.priceType = selectedPriceType

      const priceData = await fetch("https://api.belo.app/public/price").then(res => res.json())

      const actualPrice = priceData?.find(
        (pair: Pair) =>
          pair.pairCode ===
          `${selectedStablecoin === "usdc" ? "USDC" : selectedStablecoin === "usdt" ? "USDT" : "DAI"}/ARS`
      )?.[selectedPriceType]

      ctx.wizard.state.actualPrice = actualPrice

      await ctx.editMessageText(
        `
💵 *Nueva alerta dólar*
Stablecoin: *${selectedStablecoin === "usdc" ? "USDC" : selectedStablecoin === "usdt" ? "USDT" : "DAI"}*
Tipo de cotización: *${selectedPriceType === "ask" ? "Compra" : "Venta"}*
Precio actual: $ *${Math.round((Number(actualPrice) + Number.EPSILON) * 100) / 100}*
Escribí tu precio objetivo:
        `,
        {
          parse_mode: "markdown",
        }
      )
      return ctx.wizard.next()
    } else if (ctx.message?.text === "/misalertas" || ctx.message?.text === "/alerta") {
      try {
        await ctx.telegram.deleteMessage(ctx.chat.id, ctx.wizard.state.messageToEdit + 1)
        await ctx.telegram.deleteMessage(ctx.chat.id, ctx.wizard.state.messageToEdit)
      } catch (error) {}
      await ctx.scene.leave()
      return ctx.scene.enter(ctx.message?.text.replace("/", ""))
    } else {
      return ctx.deleteMessage()
    }
  },
  async (ctx: any) => {
    if (ctx.message?.text) {
      await ctx.deleteMessage()

      const price = ctx.message.text
      ctx.wizard.state.price = price

      const selectedStablecoin = ctx.wizard.state.stablecoin
      const actualPrice = ctx.wizard.state.actualPrice

      await ctx.telegram.editMessageText(
        ctx.chat.id,
        ctx.wizard.state.messageToEdit,
        undefined,
        `
💵 *Nueva alerta dólar*
Stablecoin: *${selectedStablecoin === "usdc" ? "USDC" : selectedStablecoin === "usdt" ? "USDT" : "DAI"}*
Tipo de cotización: *${ctx.wizard.state.priceType === "ask" ? "Compra" : "Venta"}*
Precio actual: $ *${Math.round((Number(actualPrice) + Number.EPSILON) * 100) / 100}*
Precio objetivo: $ *${price}*
¿Querés crear esta alerta?
        `,
        {
          parse_mode: "markdown",
          ...Markup.inlineKeyboard([Markup.button.callback("❌ No", "no"), Markup.button.callback("✅ Si", "yes")]),
        }
      )
      ctx.wizard.state.messageToEdit = ctx.message?.message_id
      return ctx.wizard.next()
    } else if (ctx.message?.text === "/misalertas" || ctx.message?.text === "/alerta") {
      try {
        await ctx.telegram.deleteMessage(ctx.chat.id, ctx.wizard.state.messageToEdit + 1)
        await ctx.telegram.deleteMessage(ctx.chat.id, ctx.wizard.state.messageToEdit)
      } catch (error) {}
      await ctx.scene.leave()
      return ctx.scene.enter(ctx.message?.text.replace("/", ""))
    } else {
      return ctx.deleteMessage()
    }
  },
  async (ctx: any) => {
    if (ctx.callbackQuery?.data === "yes" || ctx.callbackQuery?.data === "no") {
      await ctx.answerCbQuery()

      ctx.wizard.state.messageToEdit = ctx.callbackQuery.message?.message_id

      const confirmation = ctx.callbackQuery.data

      const actualPrice = ctx.wizard.state.actualPrice
      const targetPrice = ctx.wizard.state.price
      const selectedPriceType = ctx.wizard.state.priceType
      const pairCode = `${
        ctx.wizard.state.stablecoin === "usdc" ? "USDC" : ctx.wizard.state.stablecoin === "usdt" ? "USDT" : "DAI"
      }/ARS`

      if (confirmation === "yes") {
        await fetch("https://us-central1-notibelo.cloudfunctions.net/api/v1/alerts/create", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            alertType: targetPrice > actualPrice ? "rise" : "fall",
            priceType: selectedPriceType,
            priceAtCreation: Number(actualPrice),
            targetPrice: Number(targetPrice),
            pairCode: pairCode,
            chatId: Number(ctx.chat.id),
            userHandle: ctx.from?.username,
            name: ctx.from?.first_name,
            lastName: ctx.from?.last_name,
          }),
        })
          .then((res: any) => {
            if (res?.status !== 200) {
              ctx.deleteMessage()
              ctx.scene.leave()
              ctx.telegram.sendMessage(
                ADMIN_CHAT_ID,
                `❗️chatId: ${ctx.chat.id}
                  Error al crear dolar: ${res?.message}`
              )
              return ctx.reply(`❗️ Error al crear la alerta`)
            } else {
              ctx.deleteMessage()
              ctx.scene.leave()
              return ctx.reply(
                `✅ Alerta creada correctamente!
Podés ver tus alertas activas con el comando /misalertas`
              )
            }
          })
          .catch(err => {
            ctx.deleteMessage()
            ctx.scene.leave()
            return ctx.reply(`❗️ Error al crear la alerta`)
          })
      }

      if (confirmation === "no") {
        ctx.scene.leave()
        return ctx.deleteMessage()
      }
    } else if (ctx.message?.text === "/misalertas" || ctx.message?.text === "/alerta") {
      try {
        await ctx.telegram.deleteMessage(ctx.chat.id, ctx.wizard.state.messageToEdit + 1)
        await ctx.telegram.deleteMessage(ctx.chat.id, ctx.wizard.state.messageToEdit)
      } catch (error) {}
      await ctx.scene.leave()
      return ctx.scene.enter(ctx.message?.text.replace("/", ""))
    } else {
      return ctx.deleteMessage()
    }
  }
)

export default dolar
