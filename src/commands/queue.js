exports.run = function(client, message) {
  let queue = client.servers[message.guild.id].queue;
  if(queue.length == 0) {
    return message.channel.send("Queue is empty")
      .catch(err => console.log(err));
  }
  let playing = client.servers[message.guild.id].playing;
  let msg = `Now playing **${playing.title}** \`[${playing.duration}]\` queued by **${playing.user}**`;
  let i = 1;
  for(let song of queue) {
    msg += `\n${i++}. **${song.title}** \`[${song.duration}]\` queued by **${song.user}**`;
  }
  message.channel.send(msg)
    .catch(err => console.log(err));
};
