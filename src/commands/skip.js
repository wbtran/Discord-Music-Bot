exports.run = function(client, message) {
  let playing = client.servers[message.guild.id].playing;
  if(playing) {
    message.channel.send(`Skipping **${playing.title}** queued by **${playing.user}**`);
    message.guild.voiceConnection.dispatcher.end();
  }
};
