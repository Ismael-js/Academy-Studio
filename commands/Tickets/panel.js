const {
  EmbedBuilder,
  SlashCommandBuilder,
  PermissionFlagsBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
} = require('discord.js');
const fs = require('fs');
const yaml = require('yaml');
const configFile = fs.readFileSync('./config.yml', 'utf8');
const config = yaml.parse(configFile);
const { ticketCategories, logMessage, mainDB } = require('../../index.js');

module.exports = {
  enabled: config.commands.panel.enabled,
  data: new SlashCommandBuilder()
    .setName('panel')
    .setDescription('Send the ticket panel in the channel. | Envia el panel de tickets.')
    .setDefaultMemberPermissions(
      PermissionFlagsBits[config.commands.panel.permission],
    )
    .setDMPermission(false),
  async execute(interaction) {
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

    const panelEmbed = new EmbedBuilder()
      .setColor(config.commands.panel.embed.color)
      .setTitle(config.commands.panel.embed.title)
      .setDescription(config.commands.panel.embed.description)

    if (config.panelMethod === 'Buttons') {

      const buttons = [];


      const customIds = Object.keys(ticketCategories);

   
      for (const customId of customIds) {
        const category = ticketCategories[customId];

        const button = new ButtonBuilder()
          .setCustomId(customId)
          .setLabel(category.buttonLabel)
          .setStyle(ButtonStyle[category.buttonStyle])
          .setEmoji(category.buttonEmoji)


        buttons.push(button);
      }


      const actionRows = [];

    
      for (let i = 0; i < buttons.length; i += 5) {
        const buttonsGroup = buttons.slice(i, i + 5);
        const actionRow = new ActionRowBuilder().addComponents(...buttonsGroup);
        actionRows.push(actionRow);
      }

      
      await interaction.reply({
        content: 'Sending the panel in this channel...',
        ephemeral: true,
      });
    
      await interaction.channel.send({
        embeds: [panelEmbed],
        components: actionRows,
      });
      logMessage(
        `${interaction.user.tag} sent the ticket panel in the channel #${interaction.channel.name}`,
      );
    } else if (config.panelMethod === 'Menu') {
      
      const options = [];

      
      const customIds = Object.keys(ticketCategories);

    
      for (const customId of customIds) {
        const category = ticketCategories[customId];
    
        const option = new StringSelectMenuOptionBuilder()
          .setLabel(category.menuLabel)
          .setDescription(category.menuDescription)
          .setEmoji(category.menuEmoji)
          .setValue(customId);

        
        options.push(option);
      }

  
      const selectMenu = new StringSelectMenuBuilder()
        .setCustomId('categoryMenu')
        .setPlaceholder(config.menuPlaceholder)
        .setMinValues(1)
        .setMaxValues(1)
        .addOptions(options);

      
      const actionRowsMenus = new ActionRowBuilder().addComponents(selectMenu);

    
      await interaction.reply({
        content: 'Sending the panel in this channel... | Enviando el panel a este canal...',
        ephemeral: true,
      });
      // Send the panel embed and action row
      await interaction.channel
        .send({ embeds: [panelEmbed], components: [actionRowsMenus] })
        .then(async function (message) {
          await mainDB.set(`selectMenuOptions`, options);
          await mainDB.set(`ticketPanelMsgID`, message.id);
        });
      logMessage(
        `${interaction.user.tag} sent the ticket panel in the channel #${interaction.channel.name}`,
      );
    }
  },
};
