import {
  Guild,
  GuildMember,
  ChannelType,
  PermissionFlagsBits,
  TextChannel,
} from "discord.js";
import { getBooster, setPrivateChannel } from "./boosterService.js";

export async function createPrivateChannel(
  guild: Guild,
  member: GuildMember
): Promise<TextChannel> {
  const channel = await guild.channels.create({
    name: `boost-${member.user.username}`,
    type: ChannelType.GuildText,
    permissionOverwrites: [
      {
        id: guild.id,
        deny: [PermissionFlagsBits.ViewChannel],
      },
      {
        id: member.id,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ReadMessageHistory,
        ],
      },
      {
        id: guild.client.user!.id,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.ManageChannels,
        ],
      },
    ],
  });

  setPrivateChannel(member.id, channel.id);
  return channel;
}

export async function deletePrivateChannel(
  guild: Guild,
  userId: string
): Promise<void> {
  const record = getBooster(userId);
  if (!record?.privateChannelId) return;

  const channel = guild.channels.cache.get(record.privateChannelId);
  if (channel) {
    await channel.delete();
  }

  setPrivateChannel(userId, null);
}