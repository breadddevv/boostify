import {
  Guild,
  GuildMember,
  Role,
  ColorResolvable,
  PermissionFlagsBits,
} from "discord.js";
import { Config } from "../libs/loadVariables";
import { setCustomRole, getBooster, BoosterRecord } from "./boosterService";

export interface BoostLevelRole {
  minBoosts: number;
  roleId: string;
}

const BOOST_LEVEL_ROLES: BoostLevelRole[] = [
  // { minBoosts: 1, roleId: "ROLE_ID_FOR_1X" },
  // { minBoosts: 3, roleId: "ROLE_ID_FOR_3X" },
  // { minBoosts: 5, roleId: "ROLE_ID_FOR_5X" },
];

export async function assignBoosterRole(
  member: GuildMember,
  config: Config
): Promise<void> {
  if (member.roles.cache.has(config.boosterRoleId)) return;

  const role = member.guild.roles.cache.get(config.boosterRoleId);
  if (!role) return;

  await member.roles.add(role);
}

export async function removeBoosterRole(
  member: GuildMember,
  config: Config
): Promise<void> {
  if (!member.roles.cache.has(config.boosterRoleId)) return;

  const role = member.guild.roles.cache.get(config.boosterRoleId);
  if (!role) return;

  await member.roles.remove(role);
}

export async function assignLevelRoles(
  member: GuildMember,
  boostCount: number
): Promise<void> {
  if (BOOST_LEVEL_ROLES.length === 0) return;

  const eligibleRoleIds = BOOST_LEVEL_ROLES.filter(
    (lr) => boostCount >= lr.minBoosts
  ).map((lr) => lr.roleId);

  const ineligibleRoleIds = BOOST_LEVEL_ROLES.filter(
    (lr) => boostCount < lr.minBoosts
  ).map((lr) => lr.roleId);

  for (const roleId of eligibleRoleIds) {
    if (!member.roles.cache.has(roleId)) {
      const role = member.guild.roles.cache.get(roleId);
      if (role) await member.roles.add(role);
    }
  }

  for (const roleId of ineligibleRoleIds) {
    if (member.roles.cache.has(roleId)) {
      const role = member.guild.roles.cache.get(roleId);
      if (role) await member.roles.remove(role);
    }
  }
}

export async function removeAllLevelRoles(member: GuildMember): Promise<void> {
  for (const lr of BOOST_LEVEL_ROLES) {
    if (member.roles.cache.has(lr.roleId)) {
      const role = member.guild.roles.cache.get(lr.roleId);
      if (role) await member.roles.remove(role);
    }
  }
}

export async function createCustomRole(
  guild: Guild,
  member: GuildMember,
  name: string,
  color: ColorResolvable
): Promise<Role> {
  const boosterRole = guild.roles.cache.get(
    process.env["BOOSTER_ROLE_ID"] ?? ""
  );

  const position = boosterRole ? boosterRole.position + 1 : 1;

  const role = await guild.roles.create({
    name,
    color,
    permissions: [],
    position,
  });

  await member.roles.add(role);
  setCustomRole(member.id, role.id);
  return role;
}

export async function deleteCustomRole(
  guild: Guild,
  userId: string
): Promise<void> {
  const record: BoosterRecord | null = getBooster(userId);
  if (!record?.customRoleId) return;

  const role = guild.roles.cache.get(record.customRoleId);
  if (role) {
    await role.delete();
  }

  setCustomRole(userId, null);
}

export async function updateCustomRole(
  guild: Guild,
  userId: string,
  name?: string,
  color?: ColorResolvable
): Promise<Role | null> {
  const record: BoosterRecord | null = getBooster(userId);
  if (!record?.customRoleId) return null;

  const role = guild.roles.cache.get(record.customRoleId);
  if (!role) return null;

  await role.edit({
    ...(name ? { name } : {}),
    ...(color ? { color } : {}),
  });

  return role;
}