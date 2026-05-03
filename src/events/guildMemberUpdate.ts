import { EmbedBuilder, Events, GuildMember, TextChannel } from "discord.js";
import { Config } from "../libs/loadVariables.js";
import { getBooster, registerBoost, removeBoost } from "../services/boosterService.js";
import { assignBoosterRole, removeBoosterRole, assignLevelRoles, removeAllLevelRoles, deleteCustomRole } from "../services/roleService.js";
import { deletePrivateChannel } from "../services/channelService.js";

export default {
  name: Events.GuildMemberUpdate,
  once: false,
  async execute(oldMember: GuildMember, newMember: GuildMember, config: Config) {
    const wasBoostingBefore = oldMember.premiumSince !== null;
    const isBoostingNow = newMember.premiumSince !== null;

    if (!wasBoostingBefore && isBoostingNow) {
      await onBoostStart(newMember, config);
    } else if (wasBoostingBefore && !isBoostingNow) {
      await onBoostEnd(newMember, config);
    }
  }
}

async function onBoostStart(member: GuildMember, config: Config): Promise<void> {
  const existing = getBooster(member.id);
  if (existing?.boosting) return;

  const record = registerBoost(member.id, member.user.username);

  await assignBoosterRole(member, config);
  await assignLevelRoles(member, record.boostCount);

  const greetChannel = member.guild.channels.cache.get(config.greetChannelId) as TextChannel | undefined;
  if (greetChannel) {
    const embed = new EmbedBuilder()
      .setColor(0xf47fff)
      .setTitle("New Server Boost")
      .setDescription(`${member} has boosted the server.`)
      .addFields(
        { name: "Total Boosts", value: String(record.boostCount), inline: true },
        { name: "Member", value: member.user.tag, inline: true }
      )
      .setTimestamp();

    await greetChannel.send({ embeds: [embed] });
  }

  const logChannel = member.guild.channels.cache.get(config.logChannelId) as TextChannel | undefined;
  if (logChannel) {
    const logEmbed = new EmbedBuilder()
      .setColor(0x57f287)
      .setTitle("Boost Started")
      .addFields(
        { name: "User", value: `${member.user.tag} (${member.id})`, inline: false },
        { name: "Total Boost Count", value: String(record.boostCount), inline: true }
      )
      .setTimestamp();

    await logChannel.send({ embeds: [logEmbed] });
  }

  try {
    await member.send(
      `Thank you for boosting the server! You now have access to booster perks.`
    );
  } catch {
    // DMs may be closed
  }
}

async function onBoostEnd(member: GuildMember, config: Config): Promise<void> {
  const existing = getBooster(member.id);
  if (!existing?.boosting) return;

  removeBoost(member.id);

  await removeBoosterRole(member, config);
  await removeAllLevelRoles(member);
  await deleteCustomRole(member.guild, member.id);
  await deletePrivateChannel(member.guild, member.id);

  const logChannel = member.guild.channels.cache.get(config.logChannelId) as TextChannel | undefined;
  if (logChannel) {
    const logEmbed = new EmbedBuilder()
      .setColor(0xed4245)
      .setTitle("Boost Ended")
      .addFields(
        { name: "User", value: `${member.user.tag} (${member.id})`, inline: false },
        { name: "Historical Boost Count", value: String(existing.boostCount), inline: true }
      )
      .setTimestamp();

    await logChannel.send({ embeds: [logEmbed] });
  }
}