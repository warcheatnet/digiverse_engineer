require('dotenv').config()
const { 
  Client, 
  GatewayIntentBits, 
  ButtonBuilder, 
  ActionRowBuilder, 
  ButtonStyle 
} = require('discord.js')

// 🔥 INIT BOT
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
})

// 🔗 WEBHOOK CACHE
const webhookCache = new Map()

async function sendPersona(channel, name, avatar, message) {
  let webhook = webhookCache.get(channel.id)

  if (!webhook) {
    const webhooks = await channel.fetchWebhooks()
    webhook = webhooks.find(wh => wh.owner?.id === channel.client.user.id)

    if (!webhook) {
      webhook = await channel.createWebhook({ name: "Digiverse System" })
    }

    webhookCache.set(channel.id, webhook)
  }

  await webhook.send({
    content: message,
    username: name,
    avatarURL: avatar
  })
}

// 🎭 AVATAR
const avatars = {
  receptionist: 'http://digiverseresidence.my.id/digi_receptionist.png',
  rw: 'http://digiverseresidence.my.id/rw_assistant.png',
  rt: 'http://digiverseresidence.my.id/rt_guide.png',
  security: 'http://digiverseresidence.my.id/admin_security.png',
  admin: 'http://digiverseresidence.my.id/admin_helper.png'
}

// 🧠 CACHE USER
const greetedUsers = new Set()

// ✅ READY
client.once('clientReady', () => {
  console.log(`✅ Bot aktif sebagai ${client.user.tag}`)
})

// 📩 MESSAGE
client.on('messageCreate', async (message) => {
  if (message.author.bot) return
  if (message.webhookId) return

  const channelName = message.channel.name.toLowerCase()
  const userId = message.author.id

  // 🤖 RECEPTIONIST
  if (channelName.includes('gerbang-masuk')) {
    if (!greetedUsers.has(userId)) {
      greetedUsers.add(userId)

      await sendPersona(
        message.channel,
        "🤖 Receptionist",
        avatars.receptionist,
        `👋 Selamat datang ${message.author}\n\nSilakan verifikasi di 🪪・verifikasi-identitas`
      )
    }
  }

  // 🔐 PANEL VERIFY
  if (message.content === '!verify') {

    const button = new ButtonBuilder()
      .setCustomId('verify_button')
      .setLabel('✅ Verify Sekarang')
      .setStyle(ButtonStyle.Success)

    const row = new ActionRowBuilder().addComponents(button)

    await message.channel.send({
      content: "🔐 Klik tombol untuk verifikasi",
      components: [row]
    })
  }

  // 🛡️ SECURITY
  if (message.content.includes("http") && !message.member.permissions.has("Administrator")) {
    await sendPersona(
      message.channel,
      "🛡️ Security",
      avatars.security,
      `⚠️ ${message.author}, dilarang kirim link sembarangan!`
    )
  }
})

// 🎯 INTERACTION (VERIFY)
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isButton()) return

  if (interaction.customId === 'verify_button') {

    await interaction.deferReply({ ephemeral: true })

    const member = interaction.member

    const roleTamu = interaction.guild.roles.cache.get('1488839221308297247')
    const roleWarga = interaction.guild.roles.cache.get('1488839226886717561')
    const roleVerified = interaction.guild.roles.cache.get('1490973641792426126')

    try {
      await member.roles.add(roleWarga)
      await member.roles.add(roleVerified)

      await member.fetch()

      if (roleTamu) {
        await member.roles.remove(roleTamu).catch(() => {})
      }

      const welcomeChannel = interaction.guild.channels.cache.get('1489092697204457562')

      if (welcomeChannel) {
        await sendPersona(
          welcomeChannel,
          "🏘️ RW Assistant",
          avatars.rw,
          `🎉 Selamat datang ${member} sebagai Warga Digiverse!`
        )
      }

      await interaction.editReply({
        content: `✅ Kamu sudah terverifikasi!`
      })

    } catch (err) {
      console.error(err)
      await interaction.editReply({ content: "❌ Gagal memberikan role!" })
    }
  }
})

// 🔐 LOGIN
client.login(process.env.TOKEN)