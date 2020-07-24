const config = require('config');

const Discord = require('discord.js');
const client = new Discord.Client();

const ytdl = require('ytdl-core');

const Nightingale = class {
  static discordConnection;

  static setDiscordConnection = connection => {
    this.discordConnection = connection;
  }

  static sing = async videoUrl => {
    const audioStream = await ytdl(videoUrl, { filter: 'audioonly' });
    this.discordConnection.play(audioStream);
  }
}

client.login(config.discord.botToken);

client.on('ready', async () => {
  const connection = await client.joinToChannel(config.discord.voiceChannelName);

  Nightingale.setDiscordConnection(connection);
});

client.on('message', message => {
  if (!message.content.startsWith(config.discord.videoUrlPrefix)) {
    return;
  }

  Nightingale.sing(message.content);
});

client.joinToChannel = async channelName => {
  const channel = client.channels.cache.find(channel => {
    return channel.name === channelName;
  });

  if (!channel) {
    console.log('not found channel...');

    client.destroy();
    return;
  }

  return await channel.join();
}

