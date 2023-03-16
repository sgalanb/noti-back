import { Markup, Scenes } from "telegraf"
import { Pair } from "../types/beloTypes"

const alerta = new Scenes.WizardScene(
  "alerta",
  async (ctx: any) => {
    await ctx.reply(
      `
🆕 *Nueva alerta general*
Elegí una moneda base:
      `,
      {
        parse_mode: "markdown",
        ...Markup.inlineKeyboard([[Markup.button.callback("🇦🇷ARS", "ars"), Markup.button.callback("🇺🇸USD", "usd")]]),
      }
    )
    ctx.wizard.state.messageToEdit = ctx.message?.message_id
    return ctx.wizard.next()
  },
  async (ctx: any) => {
    if (ctx?.callbackQuery?.data === "ars" || ctx?.callbackQuery?.data === "usd") {
      await ctx.answerCbQuery()

      ctx.wizard.state.messageToEdit = ctx.callbackQuery.message?.message_id

      const selectedNativeCurrency = ctx.callbackQuery.data
      ctx.wizard.state.nativeCurrency = selectedNativeCurrency

      await ctx.editMessageText(
        `
🆕 *Nueva alerta general*
Moneda base: *${selectedNativeCurrency === "ars" ? "🇦🇷ARS" : "🇺🇸USD"}*
  
Elegí una moneda a monitorear:
      `,
        {
          parse_mode: "markdown",
          ...Markup.inlineKeyboard([Markup.button.callback("₿ BTC", "btc"), Markup.button.callback("Ξ ETH", "eth")]),
        }
      )
      return ctx.wizard.next()
    } else if (ctx.message?.text === "/misalertas" || ctx.message?.text === "/dolar") {
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
    if (ctx.callbackQuery?.data === "btc" || ctx.callbackQuery?.data === "eth") {
      await ctx.answerCbQuery()

      ctx.wizard.state.messageToEdit = ctx.callbackQuery.message?.message_id

      const selectedNativeCurrency = ctx.wizard.state.nativeCurrency

      const selectedCurrency = ctx.callbackQuery.data
      ctx.wizard.state.currency = selectedCurrency

      await ctx.editMessageText(
        `
🆕 *Nueva alerta general*
Moneda base: *${selectedNativeCurrency === "ars" ? "🇦🇷ARS" : "🇺🇸USD"}*
Moneda a monitorear: *${selectedCurrency === "btc" ? "₿ BTC" : selectedCurrency === "eth" ? "Ξ ETH" : "🇺🇸USD"}*
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
    } else if (ctx.message?.text === "/misalertas" || ctx.message?.text === "/dolar") {
      try {
        await ctx.telegram.deleteMessage(ctx.chat.id, ctx.wizard.state.messageToEdit - 1)
        await ctx.telegram.deleteMessage(ctx.chat.id, ctx.wizard.state.messageToEdit)
      } catch (error) {}
      await ctx.scene.leave()
      return ctx.scene.enter(ctx.message?.text.replace("/", ""))
    } else {
      return ctx.deleteMessage()
    }
  },
  async (ctx: any) => {
    if (ctx.callbackQuery?.data === "ask" || ctx.callbackQuery?.data === "bid") {
      await ctx.answerCbQuery()

      ctx.wizard.state.messageToEdit = ctx.callbackQuery.message?.message_id

      const selectedNativeCurrency = ctx.wizard.state.nativeCurrency
      const selectedCurrency = ctx.wizard.state.currency

      const selectedPriceType = ctx.callbackQuery.data
      ctx.wizard.state.priceType = selectedPriceType

      const pairCode = `${selectedCurrency === "btc" ? "BTC" : selectedCurrency === "eth" ? "ETH" : "USDC"}/${
        selectedNativeCurrency === "ars" ? "ARS" : "USDC"
      }`

      const priceData = await fetch("https://api.belo.app/public/price").then(res => res.json())

      const actualPrice = priceData?.find((pair: Pair) => pair.pairCode === pairCode)?.[selectedPriceType]

      ctx.wizard.state.pairCode = pairCode
      ctx.wizard.state.actualPrice = actualPrice

      await ctx.editMessageText(
        `
🆕 *Nueva alerta general*
Moneda base: *${selectedNativeCurrency === "ars" ? "🇦🇷ARS" : "🇺🇸USD"}*
Moneda a monitorear: *${selectedCurrency === "btc" ? "₿ BTC" : selectedCurrency === "eth" ? "Ξ ETH" : "🇺🇸USD"}*
Tipo de cotización: *${selectedPriceType === "ask" ? "Compra" : "Venta"}*
Precio actual: $ *${Math.round((Number(actualPrice) + Number.EPSILON) * 100) / 100}*
Escribí tu precio objetivo:
      `,
        {
          parse_mode: "markdown",
        }
      )
      return ctx.wizard.next()
    } else if (ctx.message?.text === "/misalertas" || ctx.message?.text === "/dolar") {
      try {
        await ctx.telegram.deleteMessage(ctx.chat.id, ctx.wizard.state.messageToEdit - 1)
        await ctx.telegram.deleteMessage(ctx.chat.id, ctx.wizard.state.messageToEdit)
      } catch (error) {}
      await ctx.scene.leave()
      return ctx.scene.enter(ctx.message?.text.replace("/", ""))
    } else {
      return ctx.deleteMessage()
    }
  },
  async (ctx: any) => {
    if (ctx.message?.text && !isNaN(ctx.message?.text) && Number(ctx.message?.text) > 0) {
      await ctx.deleteMessage()

      const selectedPriceType = ctx.wizard.state.priceType
      const selectedCurrency = ctx.wizard.state.currency
      const selectedNativeCurrency = ctx.wizard.state.nativeCurrency
      const actualPrice = ctx.wizard.state.actualPrice

      const targetPrice = ctx.message?.text
      ctx.wizard.state.price = targetPrice

      await ctx.telegram.editMessageText(
        ctx.chat.id,
        ctx.wizard.state.messageToEdit,
        undefined,
        `
🆕 *Nueva alerta general*
Moneda base: *${selectedNativeCurrency === "ars" ? "🇦🇷ARS" : "🇺🇸USD"}*
Moneda a monitorear: *${selectedCurrency === "btc" ? "₿ BTC" : selectedCurrency === "eth" ? "Ξ ETH" : "🇺🇸USD"}*
Tipo de cotización: *${selectedPriceType === "ask" ? "Compra" : "Venta"}*
Precio actual: $ *${Math.round((Number(actualPrice) + Number.EPSILON) * 100) / 100}*
Precio objetivo: $ *${targetPrice}*
¿Querés crear esta alerta?
      `,
        {
          parse_mode: "markdown",
          ...Markup.inlineKeyboard([[Markup.button.callback("❌ No", "no"), Markup.button.callback("✅ Si", "yes")]]),
        }
      )

      return ctx.wizard.next()
    } else if (ctx.message?.text === "/misalertas" || ctx.message?.text === "/dolar") {
      try {
        await ctx.telegram.deleteMessage(ctx.chat.id, ctx.wizard.state.messageToEdit - 1)
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

      const selectedPriceType = ctx.wizard.state.priceType
      const actualPrice = ctx.wizard.state.actualPrice
      const pairCode = ctx.wizard.state.pairCode
      const targetPrice = ctx.wizard.state.price

      const confirmation = ctx.callbackQuery.data

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
          .then(res => {
            ctx.deleteMessage()
            ctx.scene.leave()
            return ctx.reply(
              `✅ Alerta creada correctamente!

Podés ver tus alertas activas con el comando /misalertas`
            )
          })
          .catch(err => ctx.scene.leave())
      }
      if (confirmation === "no") {
        ctx.scene.leave()
        return ctx.deleteMessage()
      }
    } else {
      return ctx.deleteMessage()
    }
  }
)

export default alerta
