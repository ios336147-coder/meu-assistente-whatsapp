import cron from "node-cron";
import { getDueReminders, getDueMessages } from "./database.js";

export function startScheduler(getSocket) {
  cron.schedule("* * * * *", async () => {
    const sock = getSocket();
    if (!sock) return;

    try {
      const reminders = await getDueReminders();
      for (const item of reminders) {
        await sock.sendMessage(item.jid, {
          text: `⏰ *LEMBRETE*\n\n${item.message}`
        });
      }

      const messages = await getDueMessages();
      for (const item of messages) {
        await sock.sendMessage(item.jid, {
          text: item.message
        });
      }
    } catch (error) {
      console.error("Erro no agendador:", error);
    }
  }, { timezone: process.env.TZ || "America/Manaus" });

  console.log("Agendador iniciado.");
}
