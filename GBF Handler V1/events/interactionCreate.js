const { Developers, Partners, PREFIX } = require("../config/GBFconfig.json");
const { Collection, MessageEmbed } = require("discord.js");
const cooldowns = new Collection();
const { msToTime, missingPermissions, delay } = require("../utils/engine");

const emojis = require("../GBFEmojis.json");
const colours = require("../GBFColor.json");

const blacklistSchema = require("../schemas/GBF Schemas/Bot Ban Schema");

module.exports = (client) => {
  client.on("interactionCreate", async (interaction) => {
    if (interaction.isCommand()) {
      let blacklistFetch = await blacklistSchema.findOne({
        userId: interaction.user.id,
      });
      try {
        const command = client.slashCommands.get(interaction.commandName);

        if (!command) return;

        if (interaction.inGuild()) {
          const suspendgif =
            "https://cdn.discordapp.com/emojis/855834957607075850.gif?v=1";

          const suspendedembed = new MessageEmbed()
            .setTitle(`${emojis.ERROR}`)
            .setDescription(
              `You have been banned from using ${client.user.username}, if you think this is a mistake, please contact support.`
            )
            .setColor(colours.ERRORRED)
            .setThumbnail(suspendgif);

          if (blacklistFetch && blacklistFetch.Blacklist) {
            return interaction.reply({
              embeds: [suspendedembed],
              ephemeral: true,
            });
          }

          if (command.devOnly && !Partners.includes(interaction.member.id)) {
            const PartnerOnly = new MessageEmbed()
              .setTitle(`${emojis.ERROR} You can't use that`)
              .setDescription(`This command is only available for partners.`)
              .setColor(colours.ERRORRED);
            await interaction.reply({
              embeds: [PartnerOnly],
              ephemeral: true,
            });
          }

          if (command.Partner && !Developers.includes(interaction.member.id)) {
            const PartnerOnly = new MessageEmbed()
              .setTitle(`${emojis.ERROR} You can't use that`)
              .setDescription("This command is only available for developers.")
              .setColor(colours.ERRORRED);
            await interaction.reply({
              embeds: [PartnerOnly],
              ephemeral: true,
            });
          }

          if (
            command.botPermission &&
            !interaction.channel
              .permissionsFor(interaction.guild.me)
              .has(command.botPermission, true)
          ) {
            const missingPermBot = new MessageEmbed()
              .setTitle("Missing Permission")
              .setDescription(
                `I am missing the following permissions: ${missingPermissions(
                  interaction.guild.me,
                  command.botPermission
                )}`
              )
              .setColor("#e91e63")
              .setThumbnail(
                `${client.user.displayAvatarURL({
                  format: "png",
                  dynamic: true,
                  size: 1024,
                })}`
              );
            return interaction.reply({
              embeds: [missingPermBot],
              ephemeral: true,
            });
          }

          if (
            command.userPermission &&
            !interaction.member.permissions.has(command.userPermission, true)
          ) {
            const missingPermUser = new MessageEmbed()
              .setTitle("Missing Permissions")
              .setDescription(
                `You are missing the following permissions: ${missingPermissions(
                  interaction.member,
                  command.userPermission
                )}`
              )
              .setColor("#e91e63")
              .setThumbnail(
                `${client.user.displayAvatarURL({
                  format: "png",
                  dynamic: true,
                  size: 1024,
                })}`
              );
            return interaction.reply({
              embeds: [missingPermUser],
              ephemeral: true,
            });
          }
        }

        const cd = command.cooldown;
        if (cd) {
          if (!cooldowns.has(command.name))
            cooldowns.set(command.name, new Collection());

          const now = Date.now();
          const timestamps = cooldowns.get(command.name);
          const cooldownAmount = cd * 1000;

          if (timestamps.has(interaction.user.id)) {
            const expirationTime =
              timestamps.get(interaction.user.id) + cooldownAmount;

            if (now < expirationTime) {
              const timeLeft = expirationTime - now;
              const exactTime = timeLeft.toFixed(1);
              const cooldownembed = new MessageEmbed()
                .setDescription(
                  `${interaction.user}, please wait ${msToTime(
                    exactTime
                  )} before reusing the \`${command.name}\` command.`
                )
                .setColor("#e91e63");
              return interaction.reply({
                embeds: [cooldownembed],
                ephemeral: false,
              });
            }
          }
          timestamps.set(interaction.user.id, now);
          setTimeout(
            () => timestamps.delete(interaction.user.id),
            cooldownAmount
          );
        }

        const group = interaction.options.getSubcommandGroup(false);
        const subcommand = interaction.options.getSubcommand(false);

        try {
          if (command.groups || command.subcommands) {
            const sub = command.groups
              ? command.groups[group].subcommands[subcommand]
              : command.subcommands[subcommand];

            if (sub.execute)
              return await sub.execute({
                client,
                interaction,
                group,
                subcommand,
              });
          }

          await command.execute({
            client,
            interaction,
            group,
            subcommand,
          });
        } catch (e) {
          console.log(`Error running command '${command.name}'`);
          console.log(e);
        }
      } catch (e) {
        console.log(e);
      }
    } else {
      if (interaction.isButton()) {
        const command = client.buttonCommands.get(
          interaction.customId.toLowerCase()
        );
        if (!command) return;
        if (interaction.inGuild()) {
          if (command.devOnly && !Developers.includes(interaction.member.id)) {
            const devonlyembed = new MessageEmbed()
              .setDescription("Developers Only command")
              .setColor("#e91e63");
            await interaction.reply({
              embeds: [devonlyembed],
              ephemeral: true,
            });
          }

          if (
            command.userPermission &&
            !interaction.member.permissions.has(command.userPermission, true)
          ) {
            const permissionembed = new MessageEmbed()
              .setTitle("Missing Permissions")
              .setDescription(
                `You are missing the following permissions: ${missingPermissions(
                  interaction.member,
                  command.userPermission
                )}`
              )
              .setColor("#e91e63");
            await interaction.reply({
              embeds: [permissionembed],
              ephemeral: true,
            });
          }

          if (
            command.botPermission &&
            !interaction.channel
              .permissionsFor(interaction.guild.me)
              .has(command.botPermission, true)
          ) {
            const botpermissionembed = new MessageEmbed()
              .setTitle("Missing Permission")
              .setDescription(
                `I am missing the following permissions: ${missingPermissions(
                  interaction.guild.me,
                  command.botPermission
                )}`
              )
              .setColor("#e91e63")
              .setThumbnail(
                `${client.user.displayAvatarURL({
                  format: "png",
                  dynamic: true,
                  size: 1024,
                })}`
              );
            return interaction.reply({
              embeds: [botpermissionembed],
              ephemeral: true,
            });
          }

          const cd = command.cooldown;
          if (cd) {
            if (!cooldowns.has(command.name))
              cooldowns.set(command.name, new Collection());

            const now = Date.now();
            const timestamps = cooldowns.get(command.name);
            const cooldownAmount = cd * 1000;

            if (timestamps.has(interaction.author.id)) {
              const expirationTime =
                timestamps.get(interaction.author.id) + cooldownAmount;

              if (now < expirationTime) {
                const cooldownembed = new MessageEmbed()
                  .setDescription(
                    `${interaction.user}, wait ${msToTime(
                      expirationTime - now
                    )} before using the command!`
                  )
                  .setColor("#e91e63");
                await interaction.reply({
                  embeds: [cooldownembed],
                  ephemeral: true,
                });
              }
            }
            timestamps.set(interaction.author.id, now);
            setTimeout(
              () => timestamps.delete(interaction.author.id),
              cooldownAmount
            );
          }
        }
        try {
          await command.execute({
            client,
            interaction,
          });
        } catch (error) {
          console.log(
            `I ran into an error running "${command.name}" Error:`,
            error
          );
        }
      } else {
        if (interaction.isSelectMenu()) {
          const command = client.selectCmds.get(
            interaction.customId.toLowerCase()
          );
          if (!command) return;
          if (interaction.inGuild()) {
            if (
              command.userPermission &&
              !interaction.member.permissions.has(command.userPermission, true)
            ) {
              const permissionembed = new MessageEmbed()
                .setTitle("Missing Permissions")
                .setDescription(
                  `You are missing the following permissions: ${missingPermissions(
                    interaction.member,
                    command.userPermission
                  )}`
                )
                .setColor("#e91e63");
              await interaction.reply({
                embeds: [permissionembed],
                ephemeral: true,
              });
            }

            if (
              command.botPermission &&
              !interaction.channel
                .permissionsFor(interaction.guild.me)
                .has(command.botPermission, true)
            ) {
              const botpermembed = new MessageEmbed()
                .setTitle("Missing Permissions")
                .setDescription(
                  `I am missing the following Permission: ${missingPermissions(
                    interaction.guild.me,
                    command.botPermission
                  )}`
                )
                .setColor("#e91e63");
              await interaction.reply({
                embeds: [botpermembed],
                ephemeral: true,
              });
            }

            const cd = command.cooldown;
            if (cd) {
              if (!cooldowns.has(command.name))
                cooldowns.set(command.name, new Collection());

              const now = Date.now();
              const timestamps = cooldowns.get(command.name);
              const cooldownAmount = cd * 1000;

              if (timestamps.has(interaction.author.id)) {
                const expirationTime =
                  timestamps.get(interaction.author.id) + cooldownAmount;

                if (now < expirationTime) {
                  const cooldownembed = new MessageEmbed()
                    .setDescription(
                      `${interaction.user}, wait ${msToTime(
                        expirationTime - now
                      )} before using the command!`
                    )
                    .setColor("#e91e63");
                  await interaction.reply({
                    embeds: [cooldownembed],
                    ephemeral: true,
                  });
                }
              }
              timestamps.set(interaction.author.id, now);
              setTimeout(
                () => timestamps.delete(interaction.author.id),
                cooldownAmount
              );
            }

            try {
              await command.execute({
                client,
                interaction,
              });
            } catch (error) {
              console.log(
                `I ran into an error running "${command.name}" Error:`,
                error
              );
            }
          }
        } else {
          if (interaction.isContextMenu()) {
            const command = client.contextCmds.get(
              interaction.customId.toLowerCase()
            );
            if (!command) return;

            if (interaction.inGuild()) {
              if (
                command.userPermission &&
                !interaction.member.permissions.has(
                  command.userPermission,
                  true
                )
              ) {
                const permissionembed = new MessageEmbed()
                  .setTitle("Missing Permissions")
                  .setDescription(
                    `You are missing the following permissions: ${missingPermissions(
                      interaction.member,
                      command.userPermission
                    )}`
                  )
                  .setColor("#e91e63");
                await interaction.reply({
                  embeds: [permissionembed],
                  ephemeral: true,
                });
              }

              if (
                command.botPermission &&
                !interaction.channel
                  .permissionsFor(interaction.guild.me)
                  .has(command.botPermission, true)
              ) {
                const botpermembed = new MessageEmbed()
                  .setTitle("Missing Permissions")
                  .setDescription(
                    `I am missing the following Permission: ${missingPermissions(
                      interaction.guild.me,
                      command.botPermission
                    )}`
                  )
                  .setColor("#e91e63");
                await interaction.reply({
                  embeds: [botpermembed],
                  ephemeral: true,
                });
              }

              const cd = command.cooldown;
              if (cd) {
                if (!cooldowns.has(command.name))
                  cooldowns.set(command.name, new Collection());

                const now = Date.now();
                const timestamps = cooldowns.get(command.name);
                const cooldownAmount = cd * 1000;

                if (timestamps.has(interaction.author.id)) {
                  const expirationTime =
                    timestamps.get(interaction.author.id) + cooldownAmount;

                  if (now < expirationTime) {
                    const cooldownembed = new MessageEmbed()
                      .setDescription(
                        `${interaction.user}, wait ${msToTime(
                          expirationTime - now
                        )} before using the command!`
                      )
                      .setColor("#e91e63");
                    await interaction.reply({
                      embeds: [cooldownembed],
                      ephemeral: true,
                    });
                  }
                }
                timestamps.set(interaction.author.id, now);
                setTimeout(
                  () => timestamps.delete(interaction.author.id),
                  cooldownAmount
                );
              }

              try {
                await command.execute({
                  client,
                  interaction,
                });
              } catch (error) {
                console.log(
                  `I ran into an error running "${command.name}" Error:`,
                  error
                );
              }
            }
          }
        }
      }
    }
  });
};
