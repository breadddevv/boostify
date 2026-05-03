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
  ensureGuild,
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

    // All subcommands need a guild — bail early if missing
    const discordGuild = interaction.guild;
    if (!discordGuild) {
      await interaction.reply({ content: "This command can only be used in a server.", ephemeral: true });
      return;
    }

    await interaction.deferReply({ ephemeral: true });

    if (sub === "check") {
      const user = interaction.options.getUser("user", true);
      const result = await getBooster(user.id, interaction);

      if (!result?.success || !result.data) {
        await interaction.editReply({ content: `No booster record found for ${user.tag}.` });
        return;
      }

      const booster = result.data;

      const embed = new EmbedBuilder()
        .setColor(booster.active ? 0xf47fff : 0x99aab5)
        .setTitle(`Booster Info: ${user.username}`)
        .addFields(
          { name: "Status", value: booster.active ? "🟢 Active" : "🔴 Inactive", inline: true },
          { name: "Boost Count", value: String(booster.boostCounts ?? 0), inline: true },
          {
            name: "Custom Role",
            value: booster.customRole ? `<@&${booster.customRole.discordRoleId}>` : "None",
            inline: true,
          },
          { name: "First Boosted", value: `<t:${Math.floor(booster.boostedAt.getTime() / 1000)}:D>`, inline: true },
          { name: "Last Updated", value: `<t:${Math.floor(booster.updatedAt.getTime() / 1000)}:R>`, inline: true }
        )
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
      return;
    }

    if (sub === "add") {
      const user = interaction.options.getUser("user", true);
      const amount = interaction.options.getInteger("amount", true);

      await registerBoost(user.id, discordGuild.id, discordGuild.name, discordGuild.iconURL());

      const updated = await addBoostCount(user.id, discordGuild.id, amount);
      if (!updated) {
        await interaction.editReply({ content: "Failed to update boost count." });
        return;
      }

      await interaction.editReply({
        content: `Added **${amount}** boost(s) to ${user.tag}. New count: **${updated.boostCounts}**.`,
      });
      return;
    }

    if (sub === "remove") {
      const user = interaction.options.getUser("user", true);
      const amount = interaction.options.getInteger("amount", true);

      const updated = await removeBoostCount(user.id, discordGuild.id, amount);
      if (!updated) {
        await interaction.editReply({ content: `No booster record found for ${user.tag}.` });
        return;
      }

      await interaction.editReply({
        content: `Removed **${amount}** boost(s) from ${user.tag}. New count: **${updated.boostCounts}**.`,
      });
      return;
    }

    if (sub === "stats") {
      const [activeBoosters, allBoosters, totalBoosts] = await Promise.all([
        getActiveBoosters(discordGuild.id),
        getAllBoosters(discordGuild.id),
        getTotalBoosts(discordGuild.id),
      ]);

      const embed = new EmbedBuilder()
        .setColor(0xf47fff)
        .setTitle("Server Boost Statistics")
        .addFields(
          { name: "Current Boosters", value: String(activeBoosters.length), inline: true },
          { name: "Total Boosts (All Time)", value: String(totalBoosts), inline: true },
          { name: "Unique Boosters (All Time)", value: String(allBoosters.length), inline: true }
        )
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
      return;
    }
  },
};

export default boosterCommand;