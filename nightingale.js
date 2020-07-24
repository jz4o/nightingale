const config = require('config');

const Discord = require('discord.js');
const client = new Discord.Client();

client.login(config.discord.botToken);

