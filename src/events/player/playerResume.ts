import { playerRowOne, playerRowTwo } from '../../utilities/PlayerControlButton.js'
import { Manager } from '../../manager.js'
import { TextChannel } from 'discord.js'
import { RainlinkPlayer } from 'rainlink'

export default class {
  async execute(client: Manager, player: RainlinkPlayer) {
    if (player.voiceId == null) return

    const nowPlaying = client.nplayingMsg.get(`${player.guildId}`)
    if (nowPlaying) {
      nowPlaying.msg
        .edit({ components: [playerRowOne(client), playerRowTwo(client)] })
        .catch(() => null)
    }

    const setup = await client.db.setup.get(`${player.guildId}`)

    client.emit('playerResume', player)

    if (setup && setup.playmsg) {
      const channel = await client.channels.fetch(setup.channel).catch(() => undefined)
      if (!channel) return
      if (!channel.isTextBased) return
      const msg = await (channel as TextChannel).messages
        .fetch(setup.playmsg)
        .catch(() => undefined)
      if (!msg) return
      msg.edit({ components: [client.enSwitchMod] }).catch(() => null)
    }
  }
}
