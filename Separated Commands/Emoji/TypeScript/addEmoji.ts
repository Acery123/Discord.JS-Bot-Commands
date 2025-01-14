  import {
     Constants,
     MessageEmbed,
     MessageButton,
     MessageActionRow,
   } from "discord.js";

//I've put the embeds in another file to be able to update them easily
export const missingOptions = new MessageEmbed()
  .setTitle(`<:error:822091680605011978> Invalid Input`)
  .setDescription(
    `You must specify at least \`emoji-url\` or \`emoji-attachment\`.`
  )
  .setColor("#FF0000");

export const invalidURL = new MessageEmbed()
  .setTitle(`<:error:822091680605011978> Invalid URL`)
  .setDescription(
    `The URL provided has been flagged as an invalid image URL\n⤷Make sure the URL fits the following format: \`https://example.com/image.png\``
  )
  .setColor("#FF0000");

export const invalidAttachmentType = new MessageEmbed()
  .setTitle(`<:error:822091680605011978> Invalid Attachment`)
  .setDescription(
    `The attachment provided is not a valid image file\n⤷The attachment must be a valid image file (\`jpg\`, \`png\`, \`gif\` , etc.)`
  )
  .setColor("#FF0000");

export const attachmentTooBig = new MessageEmbed()
  .setTitle(`<:error:822091680605011978> Image Size Too Big`)
  .setDescription(
    `The attachment provided is too big\n⤷The maximum image size is 256kb`
  )
  .setColor("#FF0000");

  options: [
    {
      name: "emoji-name",
      description: "The name of the emoji",
      type: Constants.ApplicationCommandOptionTypes.STRING,
      required: true,
      minLength: 2,
      maxLength: 32,
    },
    {
      name: "emoji-url",
      description:
        "An image URL for the emoji || If attachment is used, attachment will be used instead",
      type: Constants.ApplicationCommandOptionTypes.STRING,
    },
    {
      name: "emoji-attachment",
      description: "An attachment for the emoji || Will always be used",
      type: Constants.ApplicationCommandOptionTypes.ATTACHMENT,
    },
  ]

   const emojiName = interaction.options.getString("emoji-name", true);
    const emojiURL = interaction.options.getString("emoji-url");
    const emojiAttachment =
      interaction.options.getAttachment("emoji-attachment");

    let addedEmoji: string;

    if (!emojiURL && !emojiAttachment)
      return interaction.reply({
        embeds: [missingOptions],
        ephemeral: true,
      });

    if (emojiURL && emojiAttachment) addedEmoji = emojiAttachment.url;
    else if (emojiURL && !emojiAttachment) addedEmoji = emojiURL;
    else if (emojiAttachment && !emojiURL) addedEmoji = emojiAttachment.url;
    else
      return interaction.reply({
        embeds: [missingOptions],
        ephemeral: true,
      });

    const imageURLRegex = /(http(s?):)([/|.|\w|\s|-])*\.(?:jpg|gif|png)/g;

    if (addedEmoji === emojiURL) {
      if (!imageURLRegex.test(addedEmoji))
        return interaction.reply({
          embeds: [invalidURL],
          ephemeral: true,
        });
      addedEmoji = addedEmoji;
    }

    if (emojiAttachment) {
      if (!emojiAttachment.contentType?.includes("image"))
        return interaction.reply({
          embeds: [invalidAttachmentType],
          ephemeral: true,
        });

      if (emojiAttachment.size >= 256000)
        return interaction.reply({
          embeds: [attachmentTooBig],
          ephemeral: true,
        });

      addedEmoji = emojiAttachment.url;
    }

    let newEmoji;

    try {
      newEmoji = await interaction.guild?.emojis.create(addedEmoji, emojiName);
    } catch (err) {
      const errorMessage = new MessageEmbed()
        .setTitle(`I ran into an error`)
        .setDescription(
          `An error occurred while trying to add the emoji\n**⚠ Size is in bytes ⚠**\n\nError:\n\`\`\`js\n${
            (err as Error).message
          }\`\`\``
        )
        .setColor("#FF0000");

      return interaction.reply({
        embeds: [errorMessage],
        ephemeral: true,
      });
    }

    const emojiEmbed = new MessageEmbed()
      .setTitle(
        `${newEmoji} Successfully added the emoji: **${newEmoji!.name}**`
      )
      .setDescription(
        `• Emoji name: ${newEmoji!.name}\n• Emoji ID: ${
          newEmoji!.id
        }\n• URL: [Emoji URL](${emojiURL})\n• Added by: ${interaction.user}`
      )
      .setColor("#e91e63")
      .setFooter({
        text: `Want emoji update logs? Join GBF logging /logs emojis`,
        iconURL: interaction.user!.displayAvatarURL(),
      })
      .setTimestamp();

    const newEmojiRow = new MessageActionRow().addComponents(
      new MessageButton()
        .setLabel(newEmoji!.name!)
        .setStyle("LINK")
        .setEmoji(newEmoji!)
        .setURL(`https://discordapp.com/emojis/${newEmoji!.id}`)
    );

    return interaction.reply({
      embeds: [emojiEmbed],
      components: [newEmojiRow],
    });
