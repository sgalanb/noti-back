import dotenv from "dotenv"

dotenv.config()

interface ENV {
  TG_BOT_TOKEN: string
  ADMIN_CHAT_ID: string
}

interface Config {
  TG_BOT_TOKEN: string
  ADMIN_CHAT_ID: string
}

const getConfig = (): ENV => {
  return {
    TG_BOT_TOKEN: process.env.TG_BOT_TOKEN as string,
    ADMIN_CHAT_ID: process.env.ADMIN_CHAT_ID as string,
  }
}

const getSanitzedConfig = (config: ENV): Config => {
  for (const [key, value] of Object.entries(config)) {
    if (value === undefined) {
      throw new Error(`Missing key ${key} in config.env`)
    }
  }
  return config as Config
}

const config = getConfig()

const sanitizedConfig = getSanitzedConfig(config)

export default sanitizedConfig
