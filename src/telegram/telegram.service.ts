import { Injectable } from '@nestjs/common';
import config from 'src/config/base.config';
import { ControlsService } from 'src/volume/controls/controls.service';
import { Context, Telegraf } from 'telegraf';
import { message } from 'telegraf/filters';

@Injectable()
export class TelegramService {
  bot: Telegraf;

  constructor(private readonly volumeControlService: ControlsService) {
    this.longPolling();
  }

  async longPolling() {
    this.bot = new Telegraf(config.BOT_TOKEN);
    this.bot.hears('/run', (ctx) => this.run(ctx));
    this.bot.hears('/stop', (ctx) => this.stop(ctx));
    this.bot.on(message('text'), (ctx) => this.handleText(ctx));
    this.bot.launch();
  }

  async handleText(ctx: Context) {
    if (ctx.chat.id !== config.OWNER_ID) {
      return;
    }

    await ctx.reply('Hello');
  }

  private async run(ctx: Context) {
    if (ctx.chat.id !== config.OWNER_ID) {
      return;
    }

    this.volumeControlService.isRunning = true;
    this.bot.telegram.sendMessage(config.OWNER_ID, 'botManager is running now');
  }

  private async stop(ctx: Context) {
    if (ctx.chat.id !== config.OWNER_ID) {
      return;
    }

    this.volumeControlService.isRunning = false;
    this.bot.telegram.sendMessage(config.OWNER_ID, 'botManager was stopped');
  }

  async notify(text) {
    this.bot.telegram.sendMessage(config.OWNER_ID, text);
  }
}
