const discord = require("discord.js");

const { OWNER_ID, PREFIX, TOKEN } = require("../config.json");

const client = new discord.Client();
client.servers = {};
client.login(TOKEN);

client.on("ready", () => {
  console.log(`[Start] ${new Date()}`);
  autojoin();
});

client.on("message", (message) => {
  if(message.author.bot) return;
  if(message.content.indexOf(PREFIX) !== 0) return;

  const args = message.content.slice(PREFIX.length).trim().split(/ +/g);
  const command = args.shift().toLowerCase();
  if(command.indexOf("../") != -1) return;

  try {
    let commandFile = require(`./commands/${command}`);
    commandFile.run(client, message, args);
  } catch(err) {/**/}
});

process.on("SIGINT", () => {
  console.log("[Exit] Shutting down");
  // disconnect from all voice channels
  for(let voiceConnection of client.voiceConnections.values()) {
    voiceConnection.disconnect();
  }
  process.exit();
});


function autojoin() {
  // get Discord user for bot's owner
  client.fetchUser(OWNER_ID)
    .then(ownerUser => {
      // check all servers for owner
      for(let guild of client.guilds.values()) {
        // initialize server objects
        client.servers[guild.id] = {
          lastMessage: undefined,
          playing: null,
          queue: []
        };
        // get server member for owner
        guild.fetchMember(ownerUser)
          .then(ownerMember => {
            if(ownerMember.voiceChannelID) {
              // autojoin if owner found in a voice channel
              let server = client.servers[guild.id];
              let voiceChannel = ownerMember.voiceChannel;
              voiceChannel.join()
                .then(connection => {
                  let voiceChannelName = voiceChannel.name;
                  server.connection = connection;
                  server.voiceChannelName = voiceChannelName;
                  console.log("[Connection] Autoconnected");
                })
                .catch(err => console.log(err));
            }
          });
      }
    })
    .catch(err => console.log(err));
}
