const {
  EmbedBuilder,
  SlashCommandBuilder,
  PermissionFlagsBits,
} = require('discord.js');
const fs = require('fs');
const yaml = require('yaml');
const configFile = fs.readFileSync('./config.yml', 'utf8');
const config = yaml.parse(configFile);
const { mainDB } = require('../../index.js');

module.exports = {
  enabled: config.commands.stats.enabled,
  data: new SlashCommandBuilder()
    .setName('stats')
    .setDescription('Shows some useful stats. | Muestra algunas estadisticas utiles.')
    .setDefaultMemberPermissions(
      PermissionFlagsBits[config.commands.stats.permission],
    )
    .setDMPermission(false),
  async execute(interaction) {
    const totalTickets = (await mainDB.get('totalTickets')) ?? 0;
    const openTickets = (await mainDB.get('openTickets')) ?? [];
    const totalOpenTickets = openTickets.length;
    const ramUsage = process.memoryUsage().heapUsed;
    const ramUsageMB = (ramUsage / 1024 / 1024).toFixed(2);

    const stats = new EmbedBuilder()
      .setTitle('Statistics')
      .setThumbnail(interaction.guild.iconURL())
      .setColor(config.default_embed_color)
      .addFields([
        { name: 'Total Tickets:', value: `${totalTickets - 1}` },
        { name: 'Total Open Tickets:', value: `${totalOpenTickets}` },
        { name: 'Current RAM Usage:', value: `${ramUsageMB} MB` },
      ])
      .setTimestamp()
      .setFooter({
        text: `Requested by: ${interaction.user.username}`,
        iconURL: `${interaction.user.displayAvatarURL({ dynamic: true })}`,
      });
    interaction.reply({ embeds: [stats] });
  },
};
