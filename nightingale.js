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

  static requestVideoUrls = [];
  static historyVideoUrls = [];

  static discordConnection;

  static isResting = () => {
    return this.playStatus === this.PLAY_STATUSES.RESTING;
  }

  static request = videoUrl => {
    this.requestVideoUrls.push(videoUrl);
  }

  static setDiscordConnection = connection => {
    this.discordConnection = connection;
  }

  static sing = async () => {
    const videoUrl = this.requestVideoUrls.shift() || this.historyVideoUrls.shift();
    if (!videoUrl) {
      return;
    }

    this.historyVideoUrls.push(videoUrl);

    const audioStream = await ytdl(videoUrl, { filter: 'audioonly' });
    const dispatcher = this.discordConnection.play(audioStream);

    this.playStatus = this.PLAY_STATUSES.SINGING;

    dispatcher.once('finish', () => {
      this.playStatus = this.PLAY_STATUSES.RESTING;

      this.sing();
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

  Nightingale.request(message.content);

  if (Nightingale.isResting()) {
    Nightingale.sing();
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

