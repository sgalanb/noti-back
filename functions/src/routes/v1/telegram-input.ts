import { Router, Request, Response } from "express"
import alerta from "../../commands/alert"
import misalertas from "../../commands/myAlerts"
import dolar from "../../commands/dolar"
import { Scenes, session, Telegraf } from "telegraf"
import config from "../../config/env"

const telegramInput = Router()

const BOT_TOKEN = config.TG_BOT_TOKEN as string

const bot = new Telegraf(BOT_TOKEN)

const textoInicial = `*notiBelo*
Creá alertas sobre los precios del dólar, Ethereum o Bitcoin en Belo.
*Comandos para interactuar con el bot:*
/dolar - Crea una alerta sobre el precio del dólar (USDC, USDT o DAI)
/alerta - Crea una alerta sobre el precio de Ethereum o Bitcoin (en ARS o USD)
/misalertas - Muestra las alertas que tenés activas y te permite borrarlas
/ayuda - Muestra este mensaje
*Extras:*
@sgalanb - Sugerencias o errores
telegram.me/notiBelo\\_bot - Compartí el bot
belo.app - Descargá la app de Belo
`

bot.start(ctx =>
  ctx.reply(
    textoInicial,
    // @ts-ignore
    { parse_mode: "markdown" }
  )
)

bot.command(["help", "ayuda"], ctx => {
  // @ts-ignore
  ctx.reply(textoInicial, { parse_mode: "markdown" })
})

// create a scene manager
const stage = new Scenes.Stage([alerta, misalertas, dolar])
// register it with Telegraf
bot.use(session())
// @ts-ignore
bot.use(stage.middleware())

// commands
bot.command("alerta", (ctx: any) => ctx.scene.enter("alerta"))
bot.command("misalertas", (ctx: any) => ctx.scene.enter("misalertas"))
bot.command("dolar", (ctx: any) => ctx.scene.enter("dolar"))
bot.command("exit", (ctx: any) => ctx.scene.leave())

// case for when the user sends a message to the bot that is not a command
bot.on("message", ctx => {})

telegramInput.post("/", async (req: Request, res: Response) => {
  const { body } = req

  // always respond Telegram immediately with a status 200 to avoid having a messsage queue
  res.status(200).send("OK")

  try {
    await bot.handleUpdate(body)
  } catch (error: any) {
    console.error("Error sending message")
    console.log(error.toString())
  }
})
