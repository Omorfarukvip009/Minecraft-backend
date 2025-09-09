import Player from "./models/Player.js";
export const playerJoin = async (name) => {
  let player = await Player.findOne({ name });
  if (!player) player = new Player({ name });
  player.joinTime = new Date();
  await player.save();
};
export const playerLogout = async (name) => {
  const player = await Player.findOne({ name });
  if (player) {
    const now = new Date();
    const diff = Math.floor((now - player.joinTime) / 60000);
    player.playtimeMinutes += diff;
    player.lastLogout = now;
    await player.save();
  }
};