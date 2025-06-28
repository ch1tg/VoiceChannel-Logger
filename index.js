const { Client, GatewayIntentBits, Partials } = require('discord.js');

require("dotenv").config();

const token = process.env.DISCORD_TOKEN;
const channelId = process.env.CHANNEL_ID;

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessages
    ],
    partials: [Partials.Channel]
});

client.once('ready', () => {
    console.log(`✅ Бот запущен как ${client.user.tag}`);
});

client.on('voiceStateUpdate', async (oldState, newState) => {
    const user = newState.member.user;
    const time = new Date().toLocaleTimeString('ru-RU', { hour12: false });
    const oldChannel = oldState.channel;
    const newChannel = newState.channel;

    let message = null;

    if (!oldChannel && newChannel) {
        message = `🟢 [${time}] ${user.username} присоединился к каналу **${newChannel.name}**`;
    } else if (oldChannel && !newChannel) {
        message = `🔴 [${time}] ${user.username} покинул канал **${oldChannel.name}**`;
    } else if (oldChannel && newChannel && oldChannel.id !== newChannel.id) {
        message = `🔄 [${time}] ${user.username} перешел из **${oldChannel.name}** в **${newChannel.name}**`;
    }

    if (message) {
        const logChannel = await client.channels.fetch(LOG_CHANNEL_ID).catch(console.error);
        if (logChannel && logChannel.isTextBased()) {
            logChannel.send(message).catch(console.error);
        }
        console.log(message);
    }
});

client.login(TOKEN);