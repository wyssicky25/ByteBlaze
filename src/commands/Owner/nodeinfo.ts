import { ApplicationCommandOptionType, EmbedBuilder } from 'discord.js'
import { Manager } from '../../manager.js'
import { Accessableby, Command } from '../../structures/Command.js'
import { CommandHandler } from '../../structures/CommandHandler.js'
import { Page } from '../../structures/Page.js'

export default class implements Command {
  public name = ['nodeinfo']
  public description = 'View all existing Lavalink nodes!'
  public category = 'Owner'
  public accessableby = [Accessableby.Owner]
  public usage = ''
  public aliases = ['lavalinklist']
  public lavalink = false
  public usingInteraction = true
  public playerCheck = false
  public sameVoiceCheck = false
  public permissions = []
  public options = [
    {
      name: 'page',
      description: 'Page number to show.',
      type: ApplicationCommandOptionType.Number,
      required: false,
    },
  ]

  public async execute(client: Manager, handler: CommandHandler) {
    await handler.deferReply()

    const value = handler.args[0]

    if (value && isNaN(+value)) {
      return handler.editReply({
        embeds: [
          new EmbedBuilder()
            .setDescription(`${client.i18n.get(handler.language, 'error', 'number_invalid')}`)
            .setColor(client.color),
        ],
      })
    }

    // Fetch Lavalink nodes data
    const nodes = client.rainlink.nodes.full.map(([_, node]) => node);
    
    let pagesNum = Math.ceil(nodes.length / 1);
    if (pagesNum === 0) pagesNum = 1;

    const nodeStrings = [];
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      const stats = node.stats;

      // hàm cặc gì đau đầu vcl
      const formatUptime = (uptimeMs) => {
        const totalSeconds = Math.floor(uptimeMs / 1000);
        const days = Math.floor(totalSeconds / (3600 * 24));
        const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
      
        return `${days}d ${hours}h ${minutes}m ${seconds}s`;
      };
      
      const StatUptime = formatUptime(stats.uptime);
    
    // Format the stats information
      const statsString = `
 Players: ${stats.players}
 Playing Players: ${stats.playingPlayers}
 Uptime: ${StatUptime}
 Memory: 
   Reservable: ${Math.round(stats.memory.reservable / 1024 / 1024)} MB
   Used: ${Math.round(stats.memory.used / 1024 / 1024)} MB
   Free: ${Math.round(stats.memory.free / 1024 / 1024)} MB
   Allocated: ${Math.round(stats.memory.allocated / 1024 / 1024)} MB
 CPU:
   Core: ${Math.round(stats.cpu.cores)} cores
   Usage: ${Math.round(stats.cpu.systemLoad)}%
   LavalinkLoad: ${Math.round(stats.cpu.lavalinkLoad)}%
 Frame:
   Sent: ${stats.frameStats.sent}
   Deficit: ${stats.frameStats.deficit}
   Nulled: ${stats.frameStats.nulled}
`;

      nodeStrings.push(`\`\`\`Node: ${i + 1}\nName: ${node.options.name}\nHost: ${node.options.host}\nPort: ${node.options.port}\nStatus: ${node.online ? '🟢' : '🔴'}\nAuth: ${node.options.auth}\nSecure: ${node.options.secure}\nDriver: ${node.options.driver}\nStats: ${statsString}\`\`\``);
    }

    const pages = [];
    for (let i = 0; i < pagesNum; i++) {
      const str = nodeStrings.slice(i * 10, i * 10 + 10).join('\n');

      const embed = new EmbedBuilder()
        .setAuthor({
          name: `${client.i18n.get(handler.language, 'command.lavalink', 'list_title')}`,
        })
        .setColor(client.color)
        .setDescription(str == '' ? 'Nothing' : '\n' + str)
        .setFooter({
          text: `${String(i + 1)}/${String(pagesNum)}`,
        });

      pages.push(embed);
    }

    if (!value) {
      if (pages.length === pagesNum && nodes.length > 10) {
        if (handler.message) {
          await new Page(client, pages, 60000, handler.language).prefixPage(handler.message);
        } else if (handler.interaction) {
          await new Page(client, pages, 60000, handler.language).slashPage(handler.interaction);
        } else return;
      } else return handler.editReply({ embeds: [pages[0]] });
    } else {
      if (isNaN(+value)) {
        return handler.editReply({
          embeds: [
            new EmbedBuilder()
              .setDescription(
                `${client.i18n.get(handler.language, 'command.lavalink', 'list_notnumber')}`
              )
              .setColor(client.color),
          ],
        });
      }
      if (Number(value) > pagesNum) {
        return handler.editReply({
          embeds: [
            new EmbedBuilder()
              .setDescription(
                `${client.i18n.get(handler.language, 'command.lavalink', 'list_page_notfound', {
                  page: String(pagesNum),
                })}`
              )
              .setColor(client.color),
          ],
        });
      }
      const pageNum = Number(value) == 0 ? 1 : Number(value) - 1;
      return handler.editReply({ embeds: [pages[pageNum]] });
    }
  }
}
