import {
  addShoppingItem,
  listShoppingItems,
  removeShoppingItem,
  clearShoppingList,
  addReminder,
  addScheduledMessage
} from "./database.js";

const tz = process.env.TZ || "America/Manaus";

function parseDateTime(dateText, timeText) {
  const [year, month, day] = dateText.split("-").map(Number);
  const [hour, minute] = timeText.split(":").map(Number);

  if (!year || !month || !day || hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    return null;
  }

  return new Date(
    new Date(year, month - 1, day, hour, minute, 0).toLocaleString("en-US", {
      timeZone: tz
    })
  );
}

function nextDateFor(dayName, time) {
  const days = {
    domingo: 0, segunda: 1, "segunda-feira": 1,
    terca: 2, "terça": 2, "terça-feira": 2,
    quarta: 3, "quarta-feira": 3,
    quinta: 4, "quinta-feira": 4,
    sexta: 5, "sexta-feira": 5,
    sabado: 6, "sábado": 6
  };

  const target = days[dayName.toLowerCase()];
  if (target === undefined) return null;

  const [hour, minute] = time.split(":").map(Number);
  if (Number.isNaN(hour) || Number.isNaN(minute)) return null;

  const now = new Date();
  const result = new Date(now);
  result.setHours(hour, minute, 0, 0);

  let diff = (target - result.getDay() + 7) % 7;
  if (diff === 0 && result <= now) diff = 7;
  result.setDate(result.getDate() + diff);
  return result;
}

function formatDate(date) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: tz,
    dateStyle: "short",
    timeStyle: "short"
  }).format(date);
}

export function menu() {
  return `🤖 *MEU ASSISTENTE*

1️⃣ /compras
2️⃣ /lembrete
3️⃣ /mensagem

*Lista de compras*
/compras adicionar arroz
/compras lista
/compras remover 1
/compras limpar

*Lembrete*
/lembrete 2026-08-16 08:00 pagar conta

*Mensagem automática*
/mensagem 2026-08-16 09:00 Bom dia!

Use /ajuda para ver os exemplos.`;
}

export function help() {
  return `📚 *EXEMPLOS*

🛒 /compras adicionar leite
🛒 /compras lista
🛒 /compras remover 2
🛒 /compras limpar

⏰ /lembrete 2026-08-16 08:00 pagar conta

💬 /mensagem 2026-08-16 09:00 Bom dia!

📅 Para um dia da semana:
 /lembrete sábado 08:00 comprar ração`;
}

export async function handleCommand(jid, text) {
  const clean = text.trim();

  if (clean === "/menu" || clean === "menu") return menu();
  if (clean === "/ajuda" || clean === "ajuda") return help();

  if (clean.startsWith("/compras")) {
    const args = clean.slice("/compras".length).trim();

    if (!args || args === "lista") {
      const items = await listShoppingItems(jid);
      if (!items.length) return "🛒 Sua lista de compras está vazia.";
      return "🛒 *LISTA DE COMPRAS*\n\n" +
        items.map(x => `${x.id}️⃣ ${x.item}`).join("\n");
    }

    if (args === "limpar") {
      await clearShoppingList(jid);
      return "🧹 Lista de compras limpa.";
    }

    if (args.startsWith("adicionar ")) {
      const item = args.slice(10).trim();
      if (!item) return "Informe o item. Ex.: /compras adicionar arroz";
      await addShoppingItem(jid, item);
      return `✅ Adicionado à lista: *${item}*`;
    }

    if (args.startsWith("remover ")) {
      const id = Number(args.slice(8).trim());
      if (!Number.isInteger(id)) return "Informe o número do item. Ex.: /compras remover 2";
      const removed = await removeShoppingItem(jid, id);
      return removed ? "✅ Item removido." : "❌ Item não encontrado.";
    }

    return "Comando de compras não reconhecido. Use /ajuda.";
  }

  if (clean.startsWith("/lembrete")) {
    const args = clean.slice("/lembrete".length).trim();
    const parts = args.split(/\s+/);

    if (parts.length < 3) {
      return "Use: /lembrete 2026-08-16 08:00 pagar conta";
    }

    let date;
    if (parts[0].includes("-")) {
      date = parseDateTime(parts[0], parts[1]);
      if (!date) return "Data/horário inválidos.";
      const message = parts.slice(2).join(" ");
      const row = await addReminder(jid, message, date);
      return `⏰ Lembrete criado!\n\n📅 ${formatDate(new Date(row.remind_at))}\n📝 ${message}`;
    }

    if (parts[0].toLowerCase() === "amanhã" || parts[0].toLowerCase() === "amanha") {
      const [hour, minute] = parts[1].split(":").map(Number);
      const date = new Date();
      date.setDate(date.getDate() + 1);
      date.setHours(hour, minute, 0, 0);
      const message = parts.slice(2).join(" ");
      const row = await addReminder(jid, message, date);
      return `⏰ Lembrete criado!\n\n📅 ${formatDate(new Date(row.remind_at))}\n📝 ${message}`;
    }

    const weekdayDate = nextDateFor(parts[0], parts[1]);
    if (weekdayDate) {
      const message = parts.slice(2).join(" ");
      const row = await addReminder(jid, message, weekdayDate);
      return `⏰ Lembrete criado!\n\n📅 ${formatDate(new Date(row.remind_at))}\n📝 ${message}`;
    }

    return "Formato inválido. Use /ajuda.";
  }

  if (clean.startsWith("/mensagem")) {
    const args = clean.slice("/mensagem".length).trim();
    const match = args.match(/^(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2})\s+([\s\S]+)$/);

    if (!match) {
      return "Use: /mensagem 2026-08-16 09:00 Bom dia!";
    }

    const [, dateText, timeText, message] = match;
    const date = parseDateTime(dateText, timeText);
    if (!date) return "Data/horário inválidos.";

    const row = await addScheduledMessage(jid, message, date);
    return `💬 Mensagem programada!\n\n📅 ${formatDate(new Date(row.send_at))}\n📝 ${message}`;
  }

  return null;
}
