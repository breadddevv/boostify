import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
} from "discord.js";
import { Command } from "../libs/loadCommands";
import { getBooster } from "../services/boosterService";
import { createPrivateChannel, deletePrivateChannel } from "../services/channelService";

const channelCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("channel")
    .setDescription("Manage your private booster channel")
    .addSubcommand((sub) =>
      sub.setName("claim").setDescription("Claim your private channel")
    )
    .addSubcommand((sub) =>
      sub.setName("delete").setDescription("Delete your private channel")
    ),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const record = getBooster(interaction.user.id);

    if (!record?.boosting) {
      await interaction.reply({
        content: "You must be an active booster to use this command.",
        ephemeral: true,
      });
      return;
    }

    const sub = interaction.options.getSubcommand();
    const guild = interaction.guild!;
    const member = await guild.members.fetch(interaction.user.id);

    if (sub === "claim") {
      if (record.privateChannelId) {
        const existing = guild.channels.cache.get(record.privateChannelId);
        if (existing) {
          await interaction.reply({
            content: `You already have a private channel: <#${record.privateChannelId}>`,
            ephemeral: true,
          });
          return;
        }
      }

      await interaction.deferReply({ ephemeral: true });

      const channel = await createPrivateChannel(guild, member);
      await interaction.editReply(`Private channel created: <#${channel.id}>`);
      return;
    }

    if (sub === "delete") {
      if (!record.privateChannelId) {
        await interaction.reply({
          content: "You do not have a private channel.",
          ephemeral: true,
        });
        return;
      }

      await interaction.deferReply({ ephemeral: true });
      await deletePrivateChannel(guild, interaction.user.id);
      await interaction.editReply("Private channel deleted.");
      return;
    }
  },
};

export default channelCommand;