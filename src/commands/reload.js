const { OWNER_ID } = require("../../config.json");

exports.run = function(client, message, args) {
  if(message.author.id != OWNER_ID ) return;
  if(!args || args.length < 1) return message.channel.send("No args");
  delete require.cache[require.resolve(`./${args[0]}.js`)];
  message.channel.send(`Reloaded \`${args[0]}\``)
    .then(() => console.log(`[Reload] Reloaded ${args[0]}`));
};
