require("dotenv").config();
const { Client, GatewayIntentBits, Partials } = require('discord.js');

const TOKEN = process.env.DISCORD_TOKEN;

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers
    ],
    partials: [Partials.Channel],
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

        await guild.channels.create({
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
    const guild = newState.guild;
    const member = newState.member || oldState.member;
    if (!member) return;
    const user = member.user;

    const logChannel = guild.channels.cache.find(
        (ch) => ch.name === "vc-audit" && ch.type === 0
    );
    if (!logChannel) return;

    const time = new Date().toLocaleTimeString('ru-RU', { hour12: false });
    const oldChannel = oldState.channel;
    const newChannel = newState.channel;

    let message = null;

    if (!oldChannel && newChannel) {
        message = `🟢 [${time}] ${user.tag} присоединился к каналу **${newChannel.name}**`;
    } else if (oldChannel && !newChannel) {
        message = `🔴 [${time}] ${user.tag} покинул канал **${oldChannel.name}**`;
    } else if (oldChannel && newChannel && oldChannel.id !== newChannel.id) {
        message = `🔄 [${time}] ${user.tag} перешёл из **${oldChannel.name}** в **${newChannel.name}**`;
    }

    if (message && logChannel.isTextBased()) {
        try {
            await logChannel.send(message);
            console.log(message);
        } catch (err) {
            console.error("❌ Не удалось отправить сообщение в лог-канал:", err);
        }
    }
});

client.login(TOKEN);