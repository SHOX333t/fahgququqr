const axios = require("axios");

// CONFIG
const API_URL = "https://mggiffyyfgtpqaxohzll.supabase.co/rest/v1/products_public?select=*,game_categories(*)&status=eq.available&order=featured.desc,created_at.desc&limit=500&category_id=eq.30860902-2e86-45d0-a247-e33776e8a3b6";

const MAX_PRICE = 100;
const DISCORD_WEBHOOK = "https://discord.com/api/webhooks/1484027431525290085/l9u2VYEBSSTAhTkar8PxD5zwc1TBG4AFx-ncKiz_dDseAMW6o-OyuBG4SdlTRShlVrVL";

// ⚠️ ESSA CHAVE VEM DO REQUEST (obrigatório)
const API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1nZ2lmZnl5Zmd0cHFheG9oemxsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIyOTQ1MzQsImV4cCI6MjA4Nzg3MDUzNH0.ZXATZ9P7rfuuLRB_bBxYnHZHGWNqCP_jl92VCzZ-ia0";

let enviados = new Set();

async function checkPrices() {
  try {
    const response = await axios.get(API_URL, {
      headers: {
        "apikey": API_KEY,
        "Authorization": `Bearer ${API_KEY}`,
        "Content-Type": "application/json"
      }
    });

    const produtos = response.data;

    if (!Array.isArray(produtos)) {
      console.log("Erro: resposta inválida");
      return;
    }

    const baratos = produtos.filter(p => {
      const preco = Number(p.price || 0);
      return preco > 0 && preco <= MAX_PRICE;
    });

    console.log("Produtos encontrados:", produtos.length);
    console.log("Baratos:", baratos.length);

    for (let item of baratos) {
      const id = item.id;

      if (!enviados.has(id)) {
        await sendDiscordAlert(item);
        enviados.add(id);
      }
    }

  } catch (err) {
    console.log("Erro API:", err.response?.data || err.message);
  }

  console.log("Verificado:", new Date().toLocaleTimeString());
}

async function sendDiscordAlert(item) {
  try {
    await axios.post(DISCORD_WEBHOOK, {
      content: `🚨 Conta barata encontrada!
💰 Preço: R$${item.price}
📦 ${item.title || "Conta Valorant"}
🔗 https://www.reidasnfa.com.br/jogo/valorant`
    });
  } catch (err) {
    console.log("Erro webhook:", err.message);
  }
}

// roda a cada 2 minutos
setInterval(checkPrices, 2 * 60 * 1000);

// primeira execução
checkPrices();