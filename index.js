const { Client, GatewayIntentBits, Partials } = require('discord.js');

require("dotenv").config();

const TOKEN = process.env.DISCORD_TOKEN;


const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages
    ],
    partials: [Partials.Channel]
});

client.once('ready', () => {
    console.log(`✅ Бот запущен как ${client.user.tag}`);
});

client.on("guildCreate", async (guild) => {
    try {
        const exists = guild.channels.cache.find(
            (ch) => ch.name === "vc-audit" && ch.type === 0
        );
        if (exists) {
            console.log(`ℹ️ Канал "vc-audit" уже существует в ${guild.name}`);
            return;
        }


        const everyoneRole = guild.roles.everyone;


        const channel = await guild.channels.create({
            name: "vc-audit",
            type: 0,
            permissionOverwrites: [
                {
                    id: everyoneRole.id,
                    deny: ["ViewChannel"],
                },
                {
                    id: guild.ownerId,
                    allow: ["ViewChannel", "SendMessages", "ReadMessageHistory"],
                },
                {
                    id: client.user.id,
                    allow: ["ViewChannel", "SendMessages", "ReadMessageHistory"],
                },
            ],
            reason: "Канал для логирования голосовых событий",
        });

        console.log(`🟩 Канал "vc-audit" создан в ${guild.name}`);
    } catch (err) {
        console.error(`❌ Ошибка при создании канала в ${guild.name}:`, err);
    }
});

client.on('voiceStateUpdate', async (oldState, newState) => {
    const user = newState.member.user;
    const guild = newState.guild;
    const logChannel = guild.channels.cache.find(
        (ch) => ch.name === "vc-audit" && ch.type === 0
    );
    if (!logChannel) return;
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
        if (logChannel && logChannel.isTextBased()) {
            logChannel.send(message).catch(console.error);
        }
        console.log(message);
    }
});

client.login(TOKEN);