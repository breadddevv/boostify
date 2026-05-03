import { Events, Interaction, InteractionType, Client } from "discord.js";

export default {
  name: Events.InteractionCreate,
  async execute(client: Client & { commands: any }, interaction: Interaction) {
    if (interaction.isAutocomplete()) {
      const command = client.commands.get(interaction.commandName);

      if (!command?.autocomplete) return;

      try {
        await command.autocomplete(interaction);
      } catch (err) {
        console.error(err);
        try {
          await interaction.respond([]);
        } catch {}
      }

      return;
    }

    if (
      interaction.type !== InteractionType.ApplicationCommand ||
      !interaction.isChatInputCommand()
    ) {
      return;
    }

    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
      await command.execute(interaction);
    } catch (err) {
      console.error(err);

      const msg = {
        content: "Something went wrong.",
        ephemeral: true
      };

      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(msg);
      } else {
        await interaction.reply(msg);
      }
    }
  }
};