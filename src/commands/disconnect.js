exports.run = function(client, message) {
  let server = client.servers[message.guild.id];
  let connection = message.guild.voiceConnection;
  if(connection) {
    server.playing = null;
    server.connection = null;
    server.voiceChannelName = null;
    connection.disconnect();
    console.log("[Connection] Disconnected");
  }
};
