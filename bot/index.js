require('dotenv').config();

const fs = require('node:fs');
const path = require('node:path');

const { REST, Routes } = require('discord.js');
const deployCommands = async () => {
    // Command logic
    try {
        const commands = [];
        const commandFiles = fs.readdirSync(path.join(__dirname, 'commands')).filter(file => file.endsWith('.js'));

        for (const file of commandFiles) {
            const command = require(`./commands/${file}`);
            if ('data' in command && 'execute' in command) {
                commands.push(command.data.toJSON());
            } else {
                console.log(`[WARNING] The command at ./commands/${file} is missing a required "data" or "execute" property!`);
            }
        }

        const rest = new REST().setToken(process.env.DISCORD_TOKEN);
        console.log(`Started refreshing ${commands.length} application (/) commands globally.`);

        const data = await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),
            { body: commands },
        );
        console.log(`Successfully reloaded all commands.`);
    } catch (error) {
        console.error('[WARNING] Error deploying commands:', error);
    }
};

const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

const {
    Client,
    GatewayIntentBits,
    Partials,
    Collection,
    ActivityType,
    PresenceUpdateStatus,
    Events
} = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
    ],
    partials: [
        Partials.Message,
        Partials.Channel,
        Partials.Reaction,
        Partials.User,
        Partials.GuildMember
    ]
});

client.commands = new Collection();

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);

    if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
    } else {
        console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
    }
}

client.once(Events.ClientReady, async () => {
    console.log(`Ready! Logged in as ${client.user.tag}`);

    // Deploy commands
    await deployCommands();
    console.log('Commands deployed globally');

    // Set bot status
    const statusType = process.env.BOT_STATUS || 'online';
    const activityType = process.env.ACTIVITY_TYPE || 'Watching';
    const activityName = process.env.ACTIVITY_NAME || 'for free games';

    const activityTypeMap = {
        'Playing': ActivityType.Playing,
        'Streaming': ActivityType.Streaming,
        'Listening': ActivityType.Listening,
        'Watching': ActivityType.Watching,
        'Competing': ActivityType.Competing
    };

    const statusMap = {
        'online': PresenceUpdateStatus.Online,
        'idle': PresenceUpdateStatus.Idle,
        'dnd': PresenceUpdateStatus.DoNotDisturb,
        'invisible': PresenceUpdateStatus.Invisible
    };

    client.user.setPresence({
        status: statusMap[statusType],
        activities: [{ 
            name: activityName, 
            type: activityTypeMap[activityType]
        }]
    });

    console.log(`Bot status set to ${statusType} with activity ${activityType} ${activityName}`);
});

client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const command = interaction.client.commands.get(interaction.commandName);

    if (!command) {
        // uncomment to debug missing commands
        // console.error(`No command matching ${interaction.commandName} was found.`);
        return;
    }

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
        } else {
            await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
        }
    }
});


client.login(process.env.DISCORD_TOKEN);