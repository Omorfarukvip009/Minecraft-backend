import mongoose from "mongoose";
const playerSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  joinTime: { type: Date, default: Date.now },
  lastLogout: { type: Date },
  playtimeMinutes: { type: Number, default: 0 },
  kills: { type: Number, default: 0 },
  deaths: { type: Number, default: 0 },
});
export default mongoose.model("Player", playerSchema);
