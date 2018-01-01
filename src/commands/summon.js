exports.run = function(client, message) {
  return new Promise((resolve, reject) => {
    if(!message.member.voiceChannel) {
      message.channel.send("You must be in a voice channel.");
      return;
    }
    let server = client.servers[message.guild.id];
    let voiceChannel = message.member.voiceChannel;
    voiceChannel.join()
      .then(connection => {
        console.log("[Connection] Connected");
        server.connection = connection;
        server.voiceChannelName = voiceChannel.name;
        resolve();
      })
      .catch(err => reject(err));
  });
};
