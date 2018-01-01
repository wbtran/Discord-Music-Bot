exports.run = function(client, message) {
  let server = client.servers[message.guild.id];
  let playing = server.playing;
  if(playing) {
    message.channel.send(`Now playing **${playing.title}** queued by **${playing.user}**`);
  }
  else {
    message.channel.send("Nothing is playing");
  }
};
