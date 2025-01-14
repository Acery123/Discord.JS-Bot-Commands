module.exports = (client) => {
    client.on("emojiCreate", async (emoji) => {
         //Emoji create : https://discord.js.org/#/docs/discord.js/stable/class/Client?scrollTo=e-emojiCreate
        //Getting data from the database, for multi-server bots
        let LogsSettings = await LogsChannel.findOne({
            guildId: emoji.guild.id
        })

        let CreateData = await Settings.findOne({
            guildId: emoji.guild.id
        })
        //If no data or if it's set to false, for multi-server bots
        if (!CreateData || !LogsSettings || LogsSettings.Channel === null) return;
        //Fetching the user set channel, for multi-server bots
        let logsChannel = emoji.guild.channels.cache.get(LogsSettings.Channel)

        if (CreateData.Enabled === true) {
            //If the channel exists, is viewable and the bot can send messages to it
            if (logsChannel && logsChannel.viewable && logsChannel.permissionsFor(emoji.guild.me).has(Permissions.FLAGS.SEND_MESSAGES)) {
            
                const fetchedLogs = await emoji.guild.fetchAuditLogs({
                    limit: 1,
                    type: 'EMOJI_CREATE',
                });
                //Getting the first entry
                const emojiLog = fetchedLogs.entries.first();
                //Getting the user who created the emoji from audit logs
                const {
                    executor
                } = emojiLog;
                const EmojiCreator = executor.tag
                const CreatedAt = `<t:${Math.floor(new Date(emoji.createdTimestamp) / 1000)}:F>` //Getting the time when the emoji was created
                let finalLink
                const id = emoji.id
                //The default link to a discord emoji
                let baseLink = `https://cdn.discordapp.com/emojis/${id}`
                const name = emoji.name
                //Support for animated emojis
                if (emoji.animated === true) {
                    finalLink = `<a:${name}:${emoji.id}>`
                    link = baseLink + ".gif"
                } else {
                    finalLink = `<:${name}:${emoji.id}>`
                    link = baseLink + ".png"
                }
                //The embed that dispalys all of the information
                const EmojiInfoEmbed = new MessageEmbed()
                    .setTitle(`${emoji} A new emoji has been added to ${emoji.guild.name}`)
                    .setColor(colours.DEFAULT)
                    .setTimestamp()
                    .addFields({
                        name: "Emoji Name:",
                        value: `${name.replace("_", ' ')}`,
                        inline: true
                    }, {
                        name: "Emoji ID:",
                        value: `${emoji.id}`,
                        inline: true
                    }, {
                        name: "Emoji Type:",
                        value: `${emoji.animated ? 'Animated' : 'Normal'}`,
                        inline: true
                    }, {
                        name: "Emoji Creator:",
                        value: `${EmojiCreator}`,
                        inline: true
                    }, {
                        name: "Emoji Added At:",
                        value: `${CreatedAt}`,
                        inline: true
                    }, {
                        name: "Emoji Link:",
                        value: `[Link](${link})`,
                        inline: true
                    })
                    .setFooter({
                        text: `${emoji.guild.name} logging powered by GBF™`,
                        iconURL: client.user.avatarURL()
                    })
                //Making a button that takes you to the emoji's URL
                const EmojiLinkB = new MessageButton()
                    .setStyle('LINK')
                    .setEmoji(emoji)
                    .setURL(link)
                    .setLabel(emoji.name)

                const EmojiLinkR = new MessageActionRow().addComponents(EmojiLinkB)
                //Creating a webhook to send the message with
                const WebHook = await logsChannel.createWebhook(`${client.user.username} Logging 🚓`, {
                    avatar: client.user.displayAvatarURL({
                        dynamic: true
                    })
                })

                try {
                    await WebHook.send({
                        embeds: [EmojiInfoEmbed],
                        components: [EmojiLinkR]
                    }).then(() => {
                        //Deleting the webhook to avoid reaching the channel limit (10)
                        setTimeout(() => WebHook.delete().catch(err => console.log(err)), 3000)
                    })
                } catch (err) {
                    //If an error occured
                    const ErrorEmbed = new MessageEmbed()
                        .setTitle("That wasn't supposed to happen")
                        .setColor(colours.ERRORRED)
                        .setDescription(`Something went wrong while running emoji create logs 🙁\nJavaScript Error:\n\`\`\`js\n${err}\`\`\``)
                        .setFooter({
                            text: `I've already sent the error to my developers, the issue will be fixed soon!`,
                            iconURL: emoji.guild.iconURL()
                        })
                    logsChannel.send({
                        embeds: [ErrorEmbed]
                    })
                    setTimeout(() => WebHook.delete().catch(err => console.log(err)), 3000)
                    return console.log(`Error while running emojiCreate: ${err}`)
                }
            } else return;
        } else return;
    })
}
