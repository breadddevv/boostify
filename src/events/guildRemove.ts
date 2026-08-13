import { Events, Guild } from "discord.js";
import { logger } from "../libs/logger.js";
import { DiscordClient } from "../base/types/discord.js";

export default {
    name: Events.GuildCreate,
    async execute(_client: DiscordClient, guild: Guild,) {
        logger.custom(`Removed to the server with ID ${guild.id}`, "REMOVED", "red");
    }
};