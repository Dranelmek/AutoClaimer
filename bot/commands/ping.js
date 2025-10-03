const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Replies with Pong and latency.'),

    async execute(interaction) {
        // Send a primary deferred reply (e.g., "Pinging...") to acknowledge the command
        // The reply() method now returns the message object by default when not ephemeral.
        const sent = await interaction.reply({ content: 'Pinging...', ephemeral: false }); 
        
        // Use editReply to modify the initial 'Pinging...' message.
        // sent.createdTimestamp is used here to get the timestamp of the initial 'Pinging...' message.
        await interaction.editReply(
            `Pong!\nLatency: ${sent.createdTimestamp - interaction.createdTimestamp}ms.\nAPI Latency: ${Math.round(interaction.client.ws.ping)}ms`
        );
    },
};