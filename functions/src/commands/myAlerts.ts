import { Alert } from "../types/types"
import { Markup, Scenes } from "telegraf"

const misalertas = new Scenes.WizardScene(
  "misalertas",
  async (ctx: any) => {
    const userAlerts = await fetch(
      `https://us-central1-notibelo.cloudfunctions.net/api/v1/alerts?chatId=${ctx.chat.id}`
    )
      .then(res => {
        return res.json()
      })
      .then(res => {
        return res.data?.filter((alert: Alert) => !alert.triggered)
      })
      .catch(async err => {
        await ctx.telegram.sendMessage(
          process.env.ADMIN_CHAT_ID,
          `❗️chatId: ${ctx.chat.id}
            Error al traer alertas de /get-alerts: ${err}`
        )
      })

    ctx.wizard.state.userAlerts = userAlerts

    ctx.wizard.state.messageToDelete
    ctx.wizard.state.messageToDelete = ctx.message?.message_id

    await ctx.reply(
      `
      🔔 *Mis alertas*
Hacé click en una alerta para eliminarla
            `,
      {
        parse_mode: "markdown",
        ...Markup.inlineKeyboard(
          userAlerts?.map((alert: Alert, index: number) => {
            return [
              Markup.button.callback(
                `${index + 1} - ${
                  alert.pairCode.startsWith("BTC")
                    ? "BTC"
                    : alert.pairCode.startsWith("ETH")
                    ? "ETH"
                    : alert.pairCode.startsWith("USDC")
                    ? "USDC"
                    : alert.pairCode.startsWith("USDT")
                    ? "USDT"
                    : alert.pairCode.startsWith("DAI")
                    ? "DAI"
                    : "ARS"
                } ${alert.alertType === "rise" ? "arriba de" : "abajo de"} $${alert.targetPrice} ${
                  alert.pairCode.endsWith("ARS") ? "ARS" : "USD"
                } ${alert.alertType === "rise" ? "📈" : "📉"} ${alert.priceType === "ask" ? "(c)" : "(v)"}`,
                String(index)
              ),
            ]
          })
        ),
      }
    )
    ctx.wizard.state.messageToEdit = ctx.message?.message_id
    return ctx.wizard.next()
  },
  async ctx => {
    if (ctx.callbackQuery?.data) {
      await ctx.answerCbQuery()

      const userAlerts = ctx.wizard.state.userAlerts

      const alertToDelete = userAlerts[ctx.callbackQuery.data]

      await fetch(
        `https://us-central1-notibelo.cloudfunctions.net/api/v1/alerts/delete?alertId=${alertToDelete.alertId}`,
        {
          method: "DELETE",
        }
      )
        .then(async res => {
          if (res.status === 200) {
            try {
              await ctx.deleteMessage()
            } catch (error) {}
            return ctx.scene.reenter()
          } else {
            await ctx.deleteMessage()
            await ctx.telegram.sendMessage(
              process.env.ADMIN_CHAT_ID,
              `❗️chatId: ${ctx.chat.id}
                    Error al eliminar alerta: ${res}`
            )
            return ctx.reply(`❗️ Error al eliminar la alerta`)
          }
        })
        .catch(async err => {
          await ctx.deleteMessage()
          await ctx.telegram.sendMessage(
            process.env.ADMIN_CHAT_ID,
            `❗️chatId: ${ctx.chat.id}
                Error al eliminar alerta: ${err}`
          )
          return ctx.reply(`❗️ Error al eliminar la alerta`)
        })
    } else if (ctx.message?.text === "/alerta" || ctx.message?.text === "/dolar") {
      try {
        await ctx.telegram.deleteMessage(ctx.chat.id, ctx.wizard.state.messageToDelete + 1)
        await ctx.telegram.deleteMessage(ctx.chat.id, ctx.wizard.state.messageToDelete)
      } catch (error) {}
      await ctx.scene.leave()
      return ctx.scene.enter(ctx.message?.text.replace("/", ""))
    } else {
      return ctx.scene.leave()
    }
  }
)

export default misalertas
