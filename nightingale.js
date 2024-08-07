import { AudioPlayerStatus, StreamType, createAudioPlayer, createAudioResource, entersState, joinVoiceChannel } from '@discordjs/voice';
import { Client, GatewayIntentBits } from 'discord.js';
import config from 'config';
import fetch from 'node-fetch';
import ytdl from '@distube/ytdl-core';

const Nightingale = class {
  static PLAY_STATUSES = {
    'RESTING': 0,
    'SINGING': 1
  };

  static PLAY_MODES = {
    'NORMAL': 0,
    'ONE_SONG_REPEAT': 1
  };

  static playStatus = this.PLAY_STATUSES.RESTING;

  static playMode = this.PLAY_MODES.NORMAL;

  static requestVideoUrls = [];

  static historyVideoUrls = [];

  static discordConnection;

  static isResting = () => this.playStatus === this.PLAY_STATUSES.RESTING;

  static isSinging = () => this.playStatus === this.PLAY_STATUSES.SINGING;

  static setModeToNormal = () => {
    if (this.isSinging() && this.isModeToOneSongRepeat()) {
      this.historyVideoUrls.push(this.requestVideoUrls.shift());
    }

    this.playMode = this.PLAY_MODES.NORMAL;
    console.log('set mode to normal.');
  };

  static setModeToOneSongRepeat = () => {
    if (this.isSinging && this.isModeToNormal()) {
      this.requestVideoUrls.unshift(this.historyVideoUrls.pop());
    }

    this.playMode = this.PLAY_MODES.ONE_SONG_REPEAT;
    console.log('set mode to one song repeat.');
  };

  static isModeToNormal = () => this.playMode === this.PLAY_MODES.NORMAL;

  static isModeToOneSongRepeat = () => this.playMode === this.PLAY_MODES.ONE_SONG_REPEAT;

  static request = videoUrl => {
    this.requestVideoUrls.push(videoUrl);
  };

  static setDiscordConnection = connection => {
    this.discordConnection = connection;
  };

  static remindSongs = async () => {
    if (!config.nightingale.remindSongsUrl) {
      return;
    }

    const requestUrl = new URL(config.nightingale.remindSongsUrl);
    requestUrl.searchParams.append('token', config.nightingale.remindSongsRequestToken);
    requestUrl.searchParams.append('action', 'memories');
    requestUrl.searchParams.append('randomize', config.nightingale.remindSongsRandomize);
    requestUrl.searchParams.append('limit', config.nightingale.remindSongsLimit);

    const requestOptions = {
      'method': config.nightingale.remindSongsRequestMethod
    };

    const memoryUrls = await fetch(requestUrl, requestOptions)
      .then(response => response.json())
      .then(json => json.memories.map(memory => memory.url));

    this.historyVideoUrls.push(...memoryUrls);
  };

  static rememberSongTitle = (url, title) => {
    if (!config.nightingale.remindSongsUrl) {
      return;
    }

    const requestUrl = new URL(config.nightingale.remindSongsUrl);
    requestUrl.searchParams.append('token', config.nightingale.remindSongsRequestToken);
    requestUrl.searchParams.append('text', 'updateUrlTitle');
    requestUrl.searchParams.append('url', url);
    requestUrl.searchParams.append('title', title.replace(/ /gu, '%20'));

    const requestOptions = {
      'body': requestUrl.searchParams.toString(),
      'headers': {
        'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8'
      },
      'method': 'post'
    };

    fetch(requestUrl, requestOptions);
  };

  static sing = async () => {
    const videoUrl = this.requestVideoUrls.shift() || this.historyVideoUrls.shift();
    if (!videoUrl) {
      return;
    }

    console.log(videoUrl);

    if (this.isModeToOneSongRepeat()) {
      this.requestVideoUrls.unshift(videoUrl);
    } else {
      this.historyVideoUrls.push(videoUrl);
    }

    const audioStream = await ytdl(videoUrl, { 'filter': 'audioonly' });
    const resource = createAudioResource(audioStream, {
      'inputType': StreamType.WebmOpus
    });
    const player = createAudioPlayer();
    this.discordConnection.subscribe(player);
    player.play(resource);

    this.playStatus = this.PLAY_STATUSES.SINGING;

    ytdl.getInfo(videoUrl).then(info => {
      this.rememberSongTitle(videoUrl, info.videoDetails.title);
    });

    const oneDayInMilliseconds = 86400000;
    await entersState(player, AudioPlayerStatus.Idle, oneDayInMilliseconds);

    this.playStatus = this.PLAY_STATUSES.RESTING;
    this.sing();
  };

  static prev = () => {
    if (this.historyVideoUrls.length <= 0) {
      return;
    }

    this.requestVideoUrls.unshift(this.historyVideoUrls.pop());
    if (!this.isModeToOneSongRepeat()) {
      this.requestVideoUrls.unshift(this.historyVideoUrls.pop());
    }

    this.sing();
  };

  static next = () => {
    if (this.isModeToOneSongRepeat()) {
      this.historyVideoUrls.push(this.requestVideoUrls.shift());
    }

    this.sing();
  };

  static cancelRequest = () => {
    this.requestVideoUrls.pop();
  };

  static again = () => {
    const latestVideoUrl = this.isModeToOneSongRepeat ? this.requestVideoUrls.shift() : this.historyVideoUrls.pop();
    if (!latestVideoUrl) {
      return;
    }

    this.requestVideoUrls.unshift(latestVideoUrl);

    this.sing();
  };
};

const client = new Client({
  'intents': [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.MessageContent
  ]
});
client.login(config.discord.botToken);

client.on('ready', async () => {
  const connection = await client.joinToChannel(config.discord.voiceChannelName);
  Nightingale.setDiscordConnection(connection);

  await Nightingale.remindSongs();

  Nightingale.sing();
});

client.on('messageCreate', message => {
  if (message.content === 'prev') {
    Nightingale.prev();
  } else if (message.content === 'next') {
    Nightingale.next();
  } else if (message.content === 'cancel request') {
    Nightingale.cancelRequest();
  } else if (message.content === 'again') {
    Nightingale.again();
  } else if (message.content === 'set mode normal') {
    Nightingale.setModeToNormal();
  } else if (message.content === 'set mode one song repeat') {
    Nightingale.setModeToOneSongRepeat();
  } else if (message.content.startsWith(config.discord.videoUrlPrefix)) {
    Nightingale.request(message.content);

    if (Nightingale.isResting()) {
      Nightingale.sing();
    }
  }
});

client.joinToChannel = channelName => {
  const channel = client.channels.cache.find(cachedChannel => cachedChannel.name === channelName);

  if (!channel) {
    console.log('not found channel...');

    client.destroy();
    return undefined;
  }

  return joinVoiceChannel({
    'adapterCreator': channel.guild.voiceAdapterCreator,
    'channelId': channel.id,
    'guildId': channel.guild.id
  });
};

