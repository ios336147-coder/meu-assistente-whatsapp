import "dotenv/config";
import express from "express";
import { initDatabase } from "./database.js";
import { startWhatsApp, getSocket } from "./whatsapp.js";
import { handleCommand } from "./commands.js";
import { startScheduler } from "./scheduler.js";

const app = express();
const port = Number(process.env.PORT || 3000);

app.get("/", (_req, res) => {
  res.send("Meu Assistente WhatsApp está online.");
});

app.get("/health", (_req, res) => {
  res.json({ ok: true, whatsapp: Boolean(getSocket()) });
});

app.listen(port, "0.0.0.0", () => {
  console.log(`Servidor HTTP na porta ${port}`);
});

await initDatabase();

const sock = await startWhatsApp();

sock.ev.on("messages.upsert", async ({ messages, type }) => {
  if (type !== "notify") return;

  for (const message of messages) {
    try {
      if (!message.message) continue;
      if (message.key.fromMe) continue;

      const jid = message.key.remoteJid;
      if (!jid || jid === "status@broadcast") continue;

      const text =
        message.message.conversation ||
        message.message.extendedTextMessage?.text ||
        "";

      if (!text.trim()) continue;

      const response = await handleCommand(jid, text);
      if (response) {
        await sock.sendMessage(jid, { text: response });
      }
    } catch (error) {
      console.error("Erro ao processar mensagem:", error);
    }
  }
});

startScheduler(getSocket);
