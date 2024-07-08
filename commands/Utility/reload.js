const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { reloadAllSlashCommands, logMessage } = require('../../index.js');

module.exports = {
  enabled: true,
  data: new SlashCommandBuilder()
    .setName('reload')
    .setDescription('Reload all the slash commands. | Recarga todo los slash commands.')
    .setDefaultMemberPermissions(PermissionFlagsBits['ManageChannels'])
    .setDMPermission(false),
  async execute(interaction) {
    await reloadAllSlashCommands();
    await interaction.reply({
      content:
        'Actualizado todos los Slash Commands, utilizar con precaución debido a los límites de velocidad. Este comando sólo debe utilizarse si hay problemas para cargar los cambios Slash Commands debido a actualizaciones del bot.',
      ephemeral: true,
    });
    logMessage(`${interaction.user.tag} actualizado todos los comandos del bot.`);
  },
};
