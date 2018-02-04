const url = require("url");
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

  let startTime;
  let startFlag = "start=";
  if(args[args.length-1].slice(0, startFlag.length).toLowerCase() === startFlag) {
    startTime = args.pop().slice(startFlag.length).toLowerCase();
    if(!isNaN(startTime[startTime.length-1])) {
      startTime += "s";
    }
  }
  let searchTerm = args.join(" ");
  let server = client.servers[message.guild.id];

  try {
    await joinChannel();
    let result = await searchSong(searchTerm, startTime);
    enqueueSong(result.title, result.url, result.begin);
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


  function searchSong(searchTerm, startTime) {
    return new Promise((resolve, reject) => {
      let parsed = url.parse(searchTerm, true);
      // youtube url
      if(parsed.host === "www.youtube.com" && parsed.query.v) searchTerm = parsed.query.v;
      // youtu.be url
      else if(parsed.host === "youtu.be" && parsed.path) searchTerm = parsed.pathname.slice(1);
      yt.searchVideos(searchTerm, 1)
        .then(ytResults => resolve({title: ytResults[0].title, url: ytResults[0].url, begin: startTime || parsed.query.t}))
        .catch(err => {
          message.channel.send("No songs found");
          reject(err);
        });
    });
  }


  function enqueueSong(title, url, begin) {
    if(server.playing != null) announceQueueing(title);
    server.queue.push({title: title, url: url, begin: begin, user: message.member.displayName});
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
        let stream = ytdl(server.playing.url);
        resolve(Object.assign(server.playing, {stream}));
      } catch(err) {
        reject(err);
      }
    });
  }


  function playSong(song) {
    return new Promise((resolve, reject) => {
      try {
        let options = {volume: VOLUME/100};
        if(song.begin) {
          let seek = convertTimestampToSeconds(song.begin);
          if(seek === 0 || isNaN(seek)) song.begin = null;
          else options.seek = seek;
        }
        announcePlaying(song);
        let dispatcher = server.connection.playStream(song.stream, options);
        server.dispatcher = dispatcher;
        // load next song in queue
        dispatcher.on("end", () => {
          server.playing = null;
          resolve();
        });
        dispatcher.on("error", err => reject(err));
      }
      catch(err) {
        reject(err);
      }
    });
  }


  function announceQueueing(title) {
    message.channel.send(`Queueing **${title}**`)
      .then(() => {
        console.log(`[Music] Queueing ${title}`);
      })
      .catch(err => console.log(err));
  }


  function announcePlaying(song) {
    let msg = `Now playing **${song.title}**`;
    if(song.begin) msg += ` starting at **${song.begin}**`;
    msg += ` queued by **${song.user}**`;
    message.channel.send(msg)
      .then(() => {
        console.log(`[Music] Now playing ${song.title} queued by ${song.user}`);
      })
      .catch(err => console.log(err));
  }


  function convertTimestampToSeconds(time) {
    let h = 0, m = 0, s = 0;
    if(time.indexOf("h") !== -1) {
      h = time.split("h");
      time = h[1];
      h = h[0];
    }
    if(time.indexOf("m") !== -1) {
      m = time.split("m");
      time = m[1];
      m = m[0];
    }
    if(time.indexOf("s") !== -1) {
      s = time.split("s");
      s = s[0];
    }
    return h*3600 + m*60 + s*1;
  }
};
