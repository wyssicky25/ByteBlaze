import { Manager } from '../../manager.js'
import { TopggService } from '../../services/TopggService.js'
import { Config } from '../../@types/Config.js'
import { config } from 'dotenv';

export default class {
  constructor(
    public config: Config,
  ) {}

  async execute(client: Manager) {
    client.logger.info('ClientReady', `Logged in ${client.user!.tag}`)

    const updatePresence = () => {
      const ACTIVITY1 = client.config.bot.ACTIVITY1;
      const ACTIVITY2 = client.config.bot.ACTIVITY2;
      const ACTIVITY3 = client.config.bot.ACTIVITY3;
      const activities = [
        {
          name: `${ACTIVITY1}`
          .replace("{client.metadata.version}", client.metadata.version),
          type: 2, // Activity type: 0 = Playing, 1 = Streaming, 2 = Listening, 3 = Watching
        },
        {
          name: `${ACTIVITY2}`,
          type: 2,
        },
        {
          name: `${ACTIVITY3}`,
          type: 3,
        },
      ];

      const randomActivity = activities[Math.floor(Math.random() * activities.length)];

      client.user!.setPresence({
        activities: [randomActivity],
        status: 'online',
      });
    };

    // Update presence every second (1000 milliseconds)
    setInterval(updatePresence, 10000);
    console.log(this.config); // Add this line to debug and check if config is properly initialized


    if (client.config.utilities.TOPGG_TOKEN && client.config.utilities.TOPGG_TOKEN.length !== 0) {
      const topgg = new TopggService(client);
      const res = await topgg.settingUp(String(client.user?.id));
      if (res) {
        client.topgg = topgg;
        client.topgg.startInterval();
      }
    }
  }
}
