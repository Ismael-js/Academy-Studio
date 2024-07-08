const {
  EmbedBuilder,
  SlashCommandBuilder,
  PermissionFlagsBits,
} = require('discord.js');
const fs = require('fs');
const yaml = require('yaml');
const configFile = fs.readFileSync('./config.yml', 'utf8');
const config = yaml.parse(configFile);
const {
  ticketsDB,
  sanitizeInput,
  logMessage,
  client,
} = require('../../index.js');

module.exports = {
  enabled: config.commands.transfer.enabled,
  data: new SlashCommandBuilder()
    .setName('transfer')
    .setDescription('Transfer the ownership of a ticket to another user. | Transferir la propiedad del ticket a otro user')
    .addUserOption((option) =>
      option.setName('user').setDescription('Select a user').setRequired(true),
    )
    .setDefaultMemberPermissions(
      PermissionFlagsBits[config.commands.transfer.permission],
    )
    .setDMPermission(false),
  async execute(interaction) {
    if (!(await ticketsDB.has(interaction.channel.id))) {
      return interaction.reply({
        content: config.errors.not_in_a_ticket,
        ephemeral: true,
      });
    }

    if (
      !interaction.member.roles.cache.some((role) =>
        config.support_role_ids.includes(role.id),
      )
    ) {
      return interaction.reply({
        content: config.errors.not_allowed,
        ephemeral: true,
      });
    }

    let optionUser = interaction.options.getUser('user');
    let ticketType = await ticketsDB.get(
      `${interaction.channel.id}.ticketType`,
    );
    let currentUser = client.users.cache.get(
      await ticketsDB.get(`${interaction.channel.id}.userID`),
    );

    if (optionUser === currentUser) {
      return interaction.reply({
        content: 'This user is already the creator of this ticket. | Este user ya es propietario del ticket.',
        ephemeral: true,
      });
    }

    interaction.channel.permissionOverwrites.delete(currentUser);
    await ticketsDB.set(`${interaction.channel.id}.userID`, optionUser.id);
    interaction.channel.permissionOverwrites.create(optionUser, {
      ViewChannel: true,
      SendMessages: true,
      ReadMessageHistory: true,
      AttachFiles: true,
      EmbedLinks: true,
    });
    const newTopic = `Ticket Creator: ${sanitizeInput(optionUser.tag)} | Ticket Type: ${ticketType}`;
    await interaction.channel.setTopic(newTopic);
    if (interaction.channel.name.includes(currentUser.username)) {
      await interaction.channel.setName(`${ticketType}-${optionUser.username}`);
    }

    let logsChannel = interaction.guild.channels.cache.get(
      config.logs_channel_id,
    );

    const logEmbed = new EmbedBuilder()
      .setColor(config.commands.transfer.LogEmbed.color)
      .setTitle(config.commands.transfer.LogEmbed.title)
      .addFields([
        {
          name: config.commands.transfer.LogEmbed.field_staff,
          value: `> ${interaction.user}\n> ${sanitizeInput(interaction.user.tag)}`,
        },
        {
          name: config.commands.transfer.LogEmbed.field_ticket,
          value: `> ${interaction.channel}\n> #${sanitizeInput(interaction.channel.name)}`,
        },
        {
          name: config.commands.transfer.LogEmbed.field_transfer,
          value: `> ${currentUser} (${sanitizeInput(currentUser.tag)}) -> ${optionUser} (${sanitizeInput(optionUser.tag)})`,
        },
      ])
      .setTimestamp()
      .setThumbnail(
        interaction.user.displayAvatarURL({
          format: 'png',
          dynamic: true,
          size: 1024,
        }),
      )
    logsChannel.send({ embeds: [logEmbed] });

    const embed = new EmbedBuilder()
      .setColor(config.commands.transfer.embed.color)
      .setDescription(
        `${config.commands.transfer.embed.description}`
          .replace(/\{user\}/g, optionUser)
          .replace(/\{user\.tag\}/g, sanitizeInput(optionUser.tag)),
      );
    interaction.reply({ embeds: [embed] });
    logMessage(
      `${interaction.user.tag} transferred the ownership of the ticket #${interaction.channel.name} to the user ${optionUser.tag}.`,
    );
  },
};
