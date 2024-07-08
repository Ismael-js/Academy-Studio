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
  ticketCategories,
} = require('../../index.js');
const customIds = Object.keys(ticketCategories);
const choices = customIds.map((customId) => {
  const category = ticketCategories[customId];
  return category.name;
});

module.exports = {
  enabled: config.commands.move.enabled,
  data: new SlashCommandBuilder()
    .setName('move')
    .setDescription('Change the ticket category. | Cambia la categoría del ticket.')
    .addStringOption((option) =>
      option
        .setName('category')
        .setDescription('Input a Category Name. | Ingresa el nombre de la categoria.')
        .setRequired(true),
    )
    .setDefaultMemberPermissions(
      PermissionFlagsBits[config.commands.move.permission],
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

    let option = interaction.options.getString('category').toLowerCase();
    let ticketType = await ticketsDB.get(
      `${interaction.channel.id}.ticketType`,
    );

    if (!choices.includes(option)) {
      return interaction.reply({
        content: `Invalid option. Available options are: ${choices.join(', ')} | Opcion no valida. Disponibles: ${choices.join(', ')}`,
        ephemeral: true,
      });
    }

    if (option === ticketType) {
      return interaction.reply({
        content: 'This ticket is already in that category. | Este ticket ya esta en esta categoria.',
        ephemeral: true,
      });
    }


    const category = Object.values(ticketCategories).find(
      (category) => category.name === option,
    );
    const categoryID = category.categoryID;

    await ticketsDB.set(`${interaction.channel.id}.ticketType`, option);
    await interaction.channel.setParent(categoryID, { lockPermissions: false });

    let logsChannel = interaction.guild.channels.cache.get(
      config.logs_channel_id,
    );

    const logEmbed = new EmbedBuilder()
      .setColor(config.commands.move.LogEmbed.color)
      .setTitle(config.commands.move.LogEmbed.title)
      .addFields([
        {
          name: config.commands.move.LogEmbed.field_staff,
          value: `> ${interaction.user}\n> ${sanitizeInput(interaction.user.tag)}`,
        },
        {
          name: config.commands.move.LogEmbed.field_ticket,
          value: `> ${interaction.channel}\n> #${sanitizeInput(interaction.channel.name)}`,
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
      .setFooter({
        text: `${interaction.user.tag}`,
        iconURL: `${interaction.user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 })}`,
      });
    logsChannel.send({ embeds: [logEmbed] });

    const embed = new EmbedBuilder()
      .setColor(config.commands.move.embed.color)
      .setDescription(
        `${config.commands.move.embed.description}`.replace(
          /\{category\}/g,
          option,
        ),
      );
    interaction.reply({ embeds: [embed] });
    logMessage(
      `${interaction.user.tag} moved the ticket #${interaction.channel.name} to the category ${option}.`,
    );
  },
};
