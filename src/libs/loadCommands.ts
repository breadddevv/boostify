import {
  Client,
  Collection,
  REST,
  Routes,
  SlashCommandBuilder,
  SlashCommandSubcommandsOnlyBuilder,
  ChatInputCommandInteraction,
} from "discord.js";
import * as fs from "fs";
import * as path from "path";

export interface Command {
  data:
    | SlashCommandBuilder
    | SlashCommandSubcommandsOnlyBuilder
    | Omit<SlashCommandBuilder, "addSubcommand" | "addSubcommandGroup">;
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
}

export async function loadCommands(
  client: Client & { commands?: Collection<string, Command> },
  clientId: string,
  guildId: string,
  token: string
): Promise<void> {
  client.commands = new Collection<string, Command>();

  const commandsPath = path.join(__dirname, "..", "commands");
  const commandFiles = fs
    .readdirSync(commandsPath)
    .filter((file) => file.endsWith(".ts") || file.endsWith(".js"));

  const commandData: ReturnType<SlashCommandBuilder["toJSON"]>[] = [];

  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const commandModule = await import(filePath) as { default: Command };
    const command = commandModule.default;

    if (!command?.data || !command?.execute) continue;

    client.commands.set(command.data.name, command);
    commandData.push(command.data.toJSON());
  }

  const rest = new REST().setToken(token);

  await rest.put(Routes.applicationGuildCommands(clientId, guildId), {
    body: commandData,
  });
}