const config = require('config');

const Discord = require('discord.js');
const client = new Discord.Client();

const ytdl = require('ytdl-core');

const Nightingale = class {
  static PLAY_STATUSES = {
    RESTING: 0,
    SINGING: 1
  };

  static playStatus = this.PLAY_STATUSES.RESTING;

  static discordConnection;

  static isResting = () => {
    return this.playStatus === this.PLAY_STATUSES.RESTING;
  }

  static setDiscordConnection = connection => {
    this.discordConnection = connection;
  }

  static sing = async videoUrl => {
    const audioStream = await ytdl(videoUrl, { filter: 'audioonly' });
    const dispatcher = this.discordConnection.play(audioStream);

    this.playStatus = this.PLAY_STATUSES.SINGING;

    dispatcher.once('finish', () => {
      this.playStatus = this.PLAY_STATUSES.RESTING;
    });
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

  if (Nightingale.isResting()) {
    Nightingale.sing(message.content);
  }
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

