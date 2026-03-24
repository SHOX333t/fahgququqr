const axios = require("axios");
const fs = require("fs");

// CONFIG
const API_URL = "https://mggiffyyfgtpqaxohzll.supabase.co/rest/v1/products_public?select=title,price,id&status=eq.available&order=created_at.desc&limit=100";

const MAX_PRICE = 100;
const API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1nZ2lmZnl5Zmd0cHFheG9oemxsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIyOTQ1MzQsImV4cCI6MjA4Nzg3MDUzNH0.ZXATZ9P7rfuuLRB_bBxYnHZHGWNqCP_jl92VCzZ-ia0";
const DISCORD_WEBHOOK = "https://discord.com/api/webhooks/1484027431525290085/l9u2VYEBSSTAhTkar8PxD5zwc1TBG4AFx-ncKiz_dDseAMW6o-OyuBG4SdlTRShlVrVL";

let enviados = new Set();

// carregar enviados
try {
  const data = fs.readFileSync("enviados.json");
  enviados = new Set(JSON.parse(data));
  console.log("Carregado enviados:", enviados.size);
} catch {
  console.log("Criando lista nova...");
}

// 🔥 pegar imagem leve (SEM puppeteer)
async function getImagem(productId) {
  try {
    const res = await axios.get(
      `https://mggiffyyfgtpqaxohzll.supabase.co/rest/v1/valorant_inventory?product_id=eq.${productId}&limit=1`,
      {
        headers: {
          apikey: API_KEY,
          Authorization: `Bearer ${API_KEY}`
        }
      }
    );

    if (res.data && res.data.length > 0) {
      const item = res.data[0];

      return (
        item.image ||
        item.icon ||
        item.thumbnail ||
        null
      );
    }

    return null;
  } catch {
    return null;
  }
}

// 🚀 FUNÇÃO PRINCIPAL
async function checkPrices() {
  try {
    const response = await axios.get(API_URL, {
      headers: {
        apikey: API_KEY,
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
        "Accept": "application/json"
      }
    });

    const produtos = response.data;

    if (!Array.isArray(produtos) || produtos.length === 0) {
      console.log("⚠️ API não retornou produtos");
      return;
    }

    const baratos = produtos.filter(p => {
      const preco = Number(p.price || 0);
      return preco > 0 && preco <= MAX_PRICE;
    });

    console.log("Produtos encontrados:", produtos.length);
    console.log("Baratos:", baratos.length);

    const LIMIT = 5;

    for (let item of baratos.slice(0, LIMIT)) {
      const preco = Number(item.price || 0);
      const id = item.id + "_" + preco;

      if (!enviados.has(id)) {
        // 🔥 pega imagem antes de enviar
        const imagem = await getImagem(item.id);

        await sendDiscordAlert({
          ...item,
          image: imagem
        });

        // delay anti rate limit
        await new Promise(r => setTimeout(r, 1200));

        enviados.add(id);

        fs.writeFileSync(
          "enviados.json",
          JSON.stringify([...enviados], null, 2)
        );
      }
    }

  } catch (err) {
    console.log("Erro API:", err.response?.data || err.message);
  }

  console.log("Verificado:", new Date().toLocaleTimeString());
}

// 🔥 DISCORD
async function sendDiscordAlert(item) {
  try {
    const preco = item.price || 0;
    const nome = item.title || "Conta Valorant";

    await axios.post(DISCORD_WEBHOOK, {
      username: "BOT NFA",
      avatar_url: "https://cdn-icons-png.flaticon.com/512/5968/5968292.png",

      embeds: [
        {
          title: "🔥 CONTA BARATA ENCONTRADA 🔥",
          description: `💸 **R$${preco}**\n📦 ${nome}`,
          url: "https://www.reidasnfa.com.br/jogo/valorant",
          color: 5763719,

          fields: [
            { name: "💰 Preço", value: `R$${preco}`, inline: true },
            { name: "📊 Status", value: "Disponível", inline: true },
            {
              name: "⚡ Oportunidade",
              value: preco <= 50 ? "🔥 MUITO BARATO" : "💥 BOM PREÇO",
              inline: true
            }
          ],

          // 🔥 imagem real ou fallback
          image: {
            url: item.image || "https://i.imgur.com/3ZQ3Z6P.png"
          },

          thumbnail: {
            url: "https://cdn-icons-png.flaticon.com/512/5968/5968292.png"
          },

          footer: {
            text: "BOT AUTOMÁTICO • 24H"
          },

          timestamp: new Date().toISOString()
        }
      ]
    });

  } catch (err) {
    console.log("Erro webhook:", err.message);
  }
}

// ⏱ loop
setInterval(checkPrices, 2 * 60 * 1000);

// start
checkPrices();