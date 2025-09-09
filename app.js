import express from "express";
import fs from "fs";
import multer from "multer";
import { exec, spawn } from "child_process";
import { Server } from "socket.io";
import { status } from "minecraft-server-util";
import { connectDB } from "./db.js";
import Player from "./models/Player.js";
import dotenv from "dotenv";
dotenv.config();
connectDB();
const app = express();
app.use(express.json());
const upload = multer({ dest: "/minecraft/plugins" });
app.post("/upload", upload.single("plugin"), (req, res) => {
  res.send({ message: "Plugin uploaded successfully!" });
});
app.delete("/plugin/:name", (req, res) => {
  const filePath = `/minecraft/plugins/${req.params.name}`;
  fs.unlink(filePath, (err) => {
    if (err) return res.status(500).send({ error: "Delete failed" });
    res.send({ message: "Deleted successfully" });
  });
});
app.get("/plugins", (req, res) => {
  try { const files = fs.readdirSync("/minecraft/plugins"); res.send({ plugins: files }); } 
  catch { res.send({ plugins: [] }); }
});
app.get("/properties", (req, res) => { const props = fs.readFileSync("/minecraft/server.properties", "utf8"); res.send({ properties: props }); });
app.post("/properties", (req, res) => { fs.writeFileSync("/minecraft/server.properties", req.body.content, "utf8"); res.send({ message: "Updated successfully" }); });
app.post("/control", (req, res) => {
  const { action } = req.body;
  let cmd = "";
  if (action === "start") cmd = "docker start minecraft";
  else if (action === "stop") cmd = "docker stop minecraft";
  else if (action === "restart") cmd = "docker restart minecraft";
  else return res.status(400).send({ error: "Invalid action" });
  exec(cmd, (err, stdout, stderr) => { if (err) return res.status(500).send({ error: stderr }); res.send({ success: true, output: stdout }); });
});
app.post("/op", (req, res) => { const { player } = req.body; if (!player) return res.status(400).send({ error: "Player required" }); exec(`docker exec minecraft rcon-cli "op ${player}"`, (err, stdout, stderr) => { if (err) return res.status(500).send({ error: stderr }); res.send({ success: true, output: stdout }); }); });
app.post("/deop", (req, res) => { const { player } = req.body; if (!player) return res.status(400).send({ error: "Player required" }); exec(`docker exec minecraft rcon-cli "deop ${player}"`, (err, stdout, stderr) => { if (err) return res.status(500).send({ error: stderr }); res.send({ success: true, output: stdout }); }); });
app.get("/player-stats", async (req, res) => { const players = await Player.find().sort({ playtimeMinutes: -1 }); res.send({ players }); });
app.get("/status", async (req, res) => {
  try { const result = await status("minecraft", 25565);
    res.send({ online: true, motd: result.motd.clean, players: result.players.online, maxPlayers: result.players.max, version: result.version.name, latency: result.roundTripLatency, playerList: result.players.sample ? result.players.sample.map((p) => p.name) : [] });
  } catch { res.send({ online: false }); }
});
const PORT = process.env.PORT || 4000;
const server = app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
const io = new Server(server, { cors: { origin: "*" } });
const mcProcess = spawn("docker", ["logs", "-f", "minecraft"]);
mcProcess.stdout.on("data", (data) => io.emit("mc-log", data.toString()));
mcProcess.stderr.on("data", (data) => io.emit("mc-log", data.toString()));
io.on("connection", (socket) => console.log("🔌 Web client connected for logs"));