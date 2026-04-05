import chalk from 'chalk'
import { Client, GatewayIntentBits} from 'discord.js'
const { TOKEN } = process.env

if (!TOKEN) {
    throw new Error(chalk.red(
        chalk.bold("No TOKEN defined in .env")
    ))
}
const client = new Client(
    {
        intents: [GatewayIntentBits.GuildMembers]
    }
)

try {
    
} catch (err){
    console.log(chalk.redBright("An error has occured:"),err)
}