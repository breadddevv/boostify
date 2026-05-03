import chalk from "chalk";
import { Client, Events } from "discord.js";

export default {
    name: Events.ClientReady,
    once: true,
    execute(client:Client) {
        if (!client.user) return;
        console.log(chalk.white(`Ready! Logged in as ${client.user.tag}`))
    }
}