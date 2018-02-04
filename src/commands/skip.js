exports.run = function(client, message) {
  try {
    let playing = client.servers[message.guild.id].playing;
    if(playing) {
      message.channel.send(`Skipping **${playing.title}** queued by **${playing.user}**`);
      client.servers[message.guild.id].dispatcher.end();
    }
  }
  catch(err) {
    console.log(err);
  }
};
