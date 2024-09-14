import { EmbedBuilder, GuildBasedChannel, PermissionFlagsBits, TextChannel } from 'discord.js'
import { Manager } from '../../manager.js'
import { Accessableby, Command } from '../../structures/Command.js'
import { CommandHandler } from '../../structures/CommandHandler.js'

export default class implements Command {
  public name = ['announcement']
  public description = 'Send announcement message to all servers'
  public category = 'Owner'
  public accessableby = [Accessableby.Admin]
  public usage = '<your_message>'
  public aliases = ['an']
  public lavalink = false
  public usingInteraction = false
  public playerCheck = false
  public sameVoiceCheck = false
  public permissions = []
  public options = []

  public async execute(client: Manager, handler: CommandHandler) {
    await handler.deferReply()

    if (!handler.args[0] || !handler.message)
      return handler.editReply({
        embeds: [new EmbedBuilder().setColor(client.color).setDescription('`⚠️` | Empty args!')],
      })

    const availableChannels: { guildName: string, channelName: string }[] = []
    const allGuilds = client.guilds.cache.map((guild) => guild)
    let sentSuccessfully = 0

    for (const guild of allGuilds) {
      const textChannels = guild.channels.cache.filter((channel) => channel.isTextBased())
      const permittedChannels = textChannels.filter((channel) =>
        channel.guild.members.me?.permissions.has(PermissionFlagsBits.SendMessages)
      )
      const generalChannels = permittedChannels.filter((channel) =>
        channel.name.includes('general')
      )
      const nonGeneralChannels = permittedChannels.filter(
        (channel) => !channel.name.includes('general')
      )
      const selectedChannel = generalChannels.size !== 0 ? generalChannels.first() : nonGeneralChannels.first()

      if (selectedChannel) {
        availableChannels.push({
          guildName: guild.name,
          channelName: selectedChannel.name,
        })

        try {
          const announcement = new EmbedBuilder()
            .setAuthor({ name: '💫 | Announcement' })
            .setDescription(this.parse(handler.message.content.replace(handler.prefix, '').split(' ').slice(1).join(' '))?.[2] || handler.message.content.replace(handler.prefix, '').split(' ').slice(1).join(' '))
            .setColor(client.color)
            .setFooter({
              text: `${handler.guild!.members.me!.displayName}`,
              iconURL: client.user!.displayAvatarURL(),
            })
          await (selectedChannel as TextChannel).send({ embeds: [announcement] })
          sentSuccessfully += 1
        } catch {
          // Do nothing if sending fails
        }
      }
    }

    const result = new EmbedBuilder()
      .setDescription(
        `\`🟢\` | **Sent successfully in ${sentSuccessfully} channels**\n\`🔴\` | **Failed to send in ${availableChannels.length - sentSuccessfully} channels**`
      )
      .setColor(client.color)
      .setFooter({
        text: `${handler.guild!.members.me!.displayName}`,
        iconURL: client.user!.displayAvatarURL(),
      })
      .addFields({
        name: 'Channels with Announcements',
        value: availableChannels.length > 0
          ? availableChannels.map(({ guildName, channelName }) => `**${guildName}**: #${channelName}`).join('\n')
          : 'No channels available',
      })

    await handler.editReply({ embeds: [result] })
  }

  protected parse(content: string): string[] | null {
    // @ts-ignore
    const result = content.match(/^```(.*?)\n(.*?)```$/ms)
    return result ? result.slice(0, 3).map((el) => el.trim()) : null
  }
}
