const ytapi = require("simple-youtube-api");
const ytdl = require("ytdl-core");

const { VOLUME, YOUTUBE_API_KEY } = require("../../config.json");
const yt = new ytapi(YOUTUBE_API_KEY);


exports.run = async function(client, message, args) {
  let memberVCID = message.member.voiceChannelID;
  if(!memberVCID) {
    // user must be in a voice channel
    return message.channel.send("You must be in a voice channel");
  }
  let botVCID = message.guild.member(client.user).voiceChannelID;
  if(botVCID && memberVCID != botVCID) {
    // user and bot must be in the same voice channel
    return message.channel.send("You must be in the same voice channel");
  }
  if(!args[0]) {
    return message.channel.send("Provide a YouTube link or search query");
  }

  let searchTerm = args.join(" ");
  let server = client.servers[message.guild.id];

  try {
    await joinChannel();
    let result = await searchSong(searchTerm);
    await enqueueSong(result.title, result.url);
    while(server.queue.length > 0) {
      let song = await loadSong();
      await playSong(song);
    }
  }
  catch(err) {
    server.playing = null;
    console.log(err);
  }


  function joinChannel() {
    return new Promise((resolve, reject) => {
      if(message.guild.voiceConnection) {
        // stay in bot's current voice channel if it is in one
        return resolve();
      }
      // join user's voice channel
      let summon = require("./summon");
      summon.run(client, message, args)
        .then(() => resolve())
        .catch(err => reject(err));
    });
  }


  function searchSong(searchTerm) {
    return new Promise((resolve, reject) => {
      yt.searchVideos(searchTerm, 1)
        .then(results => resolve(results[0]))
        .catch(err => reject(err));
    });
  }


  function enqueueSong(title, url) {
    return new Promise((resolve) => {
      if(server.playing != null) announceQueueing(title);
      server.queue.push({title: title, url: url, user: message.member.displayName});
      return resolve();
    });
  }


  function loadSong() {
    return new Promise((resolve, reject) => {
      // don't load if already loading or playing
      if(server.playing !== null) return;
      // don't load if queue empty
      if(server.queue.length == 0) return;
      // don't load if disconnected
      if(!message.guild.voiceConnection) return;
      // don't load if already playing song
      if(message.guild.voiceConnection.dispatcher) return;

      server.playing = server.queue.shift();
      try {
        let stream = ytdl(server.playing.url, {filter: "audioonly"});
        resolve(Object.assign(server.playing, {stream}));
      } catch(err) {
        reject(err);
      }
    });
  }


  function playSong(song) {
    return new Promise((resolve, reject) => {
      announcePlaying(song);
      let dispatcher = server.connection.playStream(song.stream);
      dispatcher.setVolume(VOLUME / 100);
      // load next song in queue
      dispatcher.on("end", () => {
        server.playing = null;
        song.stream.destroy();
        resolve();
      });
      dispatcher.on("error", err => reject(err));
    });
  }


  function announceQueueing(title) {
    if(server.lastMessage) {
      server.lastMessage.delete()
        .catch();
    }
    message.channel.send(`Queueing **${title}**`)
      .then(message => {
        console.log(`[Music] Queueing ${title}`);
        server.lastMessage = message;
      })
      .catch(err => console.log(err));
  }


  function announcePlaying(song) {
    if(server.lastMessage) server.lastMessage.delete()
      .catch();
    message.channel.send(`Now playing **${song.title}** queued by **${song.user}**`)
      .then(message => {
        console.log(`[Music] Now playing ${song.title} queued by ${song.user}`);
        server.lastMessage = message;
      })
      .catch(err => console.log(err));
  }
};
