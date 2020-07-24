const config = require('config');

const Discord = require('discord.js');
const client = new Discord.Client();

client.login(config.discord.botToken);

client.on('ready', () => {
  client.joinToChannel(config.discord.voiceChannelName);
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

