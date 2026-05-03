import {
  Client,
  GatewayIntentBits,
  Partials,
  Collection,
  Events,
  GuildMember,
  ChatInputCommandInteraction,
  ActivityType,
  MessageFlags,
  InteractionReplyOptions,
} from "discord.js";
import * as dotenv from "dotenv";
import { loadVariables } from "./libs/loadVariables";
import { loadCommands, Command } from "./libs/loadCommands";
import { handleGuildMemberUpdate } from "./events/guildMemberUpdate";

dotenv.config();

const config = loadVariables();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
  ],
  partials: [Partials.GuildMember],
}) as Client & { commands?: Collection<string, Command> };

client.once(Events.ClientReady, async (readyClient) => {
  console.log(`Logged in as ${readyClient.user.tag}`);

  await loadCommands(client, config.clientId, config.guildId, config.botToken);
  console.log("Commands loaded and registered.");

  readyClient.user.setPresence({
    activities: [{ name: "people boost!", type: ActivityType.Watching }],
    status: "online",
  });
});

client.on(Events.GuildMemberUpdate, async (oldMember, newMember) => {
  if (oldMember.partial) {
    try {
      await oldMember.fetch();
    } catch {
      return;
    }
  }

  await handleGuildMemberUpdate(
    oldMember as GuildMember,
    newMember as GuildMember,
    config
  ).catch((err: unknown) => console.error("guildMemberUpdate error:", err));
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands?.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction as ChatInputCommandInteraction);
  } catch (error) {
    console.error(`Error executing command ${interaction.commandName}:`, error);

    const payload = {
      content: "An error occurred.",
      flags: MessageFlags.Ephemeral,
    } as const;
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(payload).catch(() => null);
    } else {
      await interaction.reply(payload).catch(() => null);
    }
  }
});

client.login(config.botToken).catch((err: unknown) => {
  console.error("Failed to log in:", err);
  process.exit(1);
});
