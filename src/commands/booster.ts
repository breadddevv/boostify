import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  PermissionFlagsBits,
} from "discord.js";
import { Command } from "../libs/loadCommands.js";
import {
  getBooster,
  addBoostCount,
  removeBoostCount,
  getAllBoosters,
  getActiveBoosters,
  getTotalBoosts,
  registerBoost,
} from "../services/boosterService.js";

const boosterCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("booster")
    .setDescription("Booster management commands")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((sub) =>
      sub
        .setName("check")
        .setDescription("Check booster info for a user")
        .addUserOption((opt) =>
          opt.setName("user").setDescription("The user to check").setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("add")
        .setDescription("Add boost count to a user")
        .addUserOption((opt) =>
          opt.setName("user").setDescription("The user").setRequired(true)
        )
        .addIntegerOption((opt) =>
          opt
            .setName("amount")
            .setDescription("Amount to add")
            .setRequired(true)
            .setMinValue(1)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("remove")
        .setDescription("Remove boost count from a user")
        .addUserOption((opt) =>
          opt.setName("user").setDescription("The user").setRequired(true)
        )
        .addIntegerOption((opt) =>
          opt
            .setName("amount")
            .setDescription("Amount to remove")
            .setRequired(true)
            .setMinValue(1)
        )
    )
    .addSubcommand((sub) =>
      sub.setName("stats").setDescription("View server boost statistics")
    ),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const sub = interaction.options.getSubcommand();

    if (sub === "check") {
      const user = interaction.options.getUser("user", true);
      const record = getBooster(user.id);

      if (!record) {
        await interaction.reply({
          content: `No booster record found for ${user.tag}.`,
          ephemeral: true,
        });
        return;
      }

      const embed = new EmbedBuilder()
        .setColor(record.boosting ? 0xf47fff : 0x99aab5)
        .setTitle(`Booster Info: ${record.username}`)
        .addFields(
          { name: "Status", value: record.boosting ? "Active" : "Inactive", inline: true },
          { name: "Boost Count", value: String(record.boostCount), inline: true },
          { name: "Custom Role", value: record.customRoleId ? `<@&${record.customRoleId}>` : "None", inline: true },
          { name: "Private Channel", value: record.privateChannelId ? `<#${record.privateChannelId}>` : "None", inline: true },
          { name: "First Boosted", value: new Date(record.firstBoostAt).toLocaleDateString(), inline: true },
          { name: "Last Updated", value: new Date(record.lastUpdatedAt).toLocaleDateString(), inline: true }
        )
        .setTimestamp();

      await interaction.reply({ embeds: [embed], ephemeral: true });
      return;
    }

    if (sub === "add") {
      const user = interaction.options.getUser("user", true);
      const amount = interaction.options.getInteger("amount", true);

      let record = getBooster(user.id);
      if (!record) {
        record = registerBoost(user.id, user.username);
      }

      const updated = addBoostCount(user.id, amount);
      if (!updated) {
        await interaction.reply({ content: "Failed to update boost count.", ephemeral: true });
        return;
      }

      await interaction.reply({
        content: `Added ${amount} boost(s) to ${user.tag}. New count: ${updated.boostCount}.`,
        ephemeral: true,
      });
      return;
    }

    if (sub === "remove") {
      const user = interaction.options.getUser("user", true);
      const amount = interaction.options.getInteger("amount", true);

      const updated = removeBoostCount(user.id, amount);
      if (!updated) {
        await interaction.reply({ content: `No booster record found for ${user.tag}.`, ephemeral: true });
        return;
      }

      await interaction.reply({
        content: `Removed ${amount} boost(s) from ${user.tag}. New count: ${updated.boostCount}.`,
        ephemeral: true,
      });
      return;
    }

    if (sub === "stats") {
      const activeBoosters = getActiveBoosters();
      const allBoosters = getAllBoosters();
      const totalBoosts = getTotalBoosts();

      const embed = new EmbedBuilder()
        .setColor(0xf47fff)
        .setTitle("Server Boost Statistics")
        .addFields(
          { name: "Current Boosters", value: String(activeBoosters.length), inline: true },
          { name: "Total Boosts (All Time)", value: String(totalBoosts), inline: true },
          { name: "Unique Boosters (All Time)", value: String(allBoosters.length), inline: true }
        )
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
      return;
    }
  },
};

export default boosterCommand;