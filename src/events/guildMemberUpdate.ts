import { EmbedBuilder, Events, GuildMember, TextChannel } from "discord.js";
import { Config } from "../libs/loadVariables.js";
import { registerBoost, removeBoost } from "../services/boosterService.js";
import { assignBoosterRole, removeBoosterRole, assignLevelRoles, removeAllLevelRoles, deleteCustomRole } from "../services/roleService.js";

export default {
  name: Events.GuildMemberUpdate,
  async execute(oldMember: GuildMember, newMember: GuildMember, config: Config) {
    const wasBoostingBefore = oldMember.premiumSince !== null;
    const isBoostingNow = newMember.premiumSince !== null;

    if (!wasBoostingBefore && isBoostingNow) {
      await onBoostStart(newMember, config);
    } else if (wasBoostingBefore && !isBoostingNow) {
      await onBoostEnd(newMember, config);
    }
  }
};

async function onBoostStart(member: GuildMember, config: Config): Promise<void> {
  const guild = member.guild;

  const record = await registerBoost(
    member.id,
    guild.id,
    guild.name,
    guild.iconURL()
  );

  if (!record) return;

  await assignBoosterRole(member, config);
  await assignLevelRoles(member, record.boostCounts ?? 1);

  const greetChannel = guild.channels.cache.get(config.greetChannelId) as TextChannel | undefined;
  if (greetChannel) {
    const embed = new EmbedBuilder()
      .setColor(0xf47fff)
      .setTitle("New Server Boost! 🎉")
      .setDescription(`${member} has boosted the server!`)
      .addFields(
        { name: "Total Boosts", value: String(record.boostCounts ?? 1), inline: true },
        { name: "Member", value: member.user.tag, inline: true }
      )
      .setTimestamp();

    await greetChannel.send({ embeds: [embed] });
  }

  const logChannel = guild.channels.cache.get(config.logChannelId) as TextChannel | undefined;
  if (logChannel) {
    const logEmbed = new EmbedBuilder()
      .setColor(0x57f287)
      .setTitle("Boost Started")
      .addFields(
        { name: "User", value: `${member.user.tag} (${member.id})`, inline: false },
        { name: "Total Boost Count", value: String(record.boostCounts ?? 1), inline: true }
      )
      .setTimestamp();

    await logChannel.send({ embeds: [logEmbed] });
  }

  try {
    await member.send(`Thank you for boosting the server! You now have access to booster perks.`);
  } catch {
    // DMs may be closed
  }
}

async function onBoostEnd(member: GuildMember, config: Config): Promise<void> {
  const guild = member.guild;

  const result = await removeBoost(member.id, guild.id);
  if (!result) return;

  await removeBoosterRole(member, config);
  await removeAllLevelRoles(member);
  await deleteCustomRole(guild, member.id);

  const logChannel = guild.channels.cache.get(config.logChannelId) as TextChannel | undefined;
  if (logChannel) {
    const logEmbed = new EmbedBuilder()
      .setColor(0xed4245)
      .setTitle("Boost Ended")
      .addFields(
        { name: "User", value: `${member.user.tag} (${member.id})`, inline: false },
        { name: "Historical Boost Count", value: String(result.boostCounts ?? 0), inline: true }
      )
      .setTimestamp();

    await logChannel.send({ embeds: [logEmbed] });
  }
}