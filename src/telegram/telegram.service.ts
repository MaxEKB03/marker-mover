import { Injectable } from '@nestjs/common';
import config from 'src/config/base.config';
import { ControlsService } from 'src/volume/controls/controls.service';
import { Context, Telegraf } from 'telegraf';
import { message } from 'telegraf/filters';
import { forceReply } from 'telegraf/typings/markup';

@Injectable()
export class TelegramService {
  bot: Telegraf;

  constructor(private readonly volumeControlService: ControlsService) {
    this.longPolling();
  }

  async longPolling() {
    this.bot = new Telegraf(config.BOT_TOKEN);
    this.bot.command('run', (ctx) => this.run(ctx));
    this.bot.command('stop', (ctx) => this.stop(ctx));
    this.bot.command('nextWallet', (ctx) => this.nextWallet(ctx));
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
    await this.bot.telegram.sendMessage(
      config.OWNER_ID,
      'botManager is running now',
    );
  }

  private async stop(ctx: Context) {
    if (ctx.chat.id !== config.OWNER_ID) {
      return;
    }

    this.volumeControlService.isRunning = false;
    await this.bot.telegram.sendMessage(
      config.OWNER_ID,
      'botManager was stopped',
    );
  }

  private async nextWallet(ctx: Context) {
    if (ctx.chat.id !== config.OWNER_ID) {
      return;
    }

    try {
      const nextId = Number(ctx.text.split(' ')[1]);
      this.volumeControlService.incrementWalletId(nextId);
      this.bot.telegram.sendMessage(
        config.OWNER_ID,
        `Next wallet id is ${this.volumeControlService.walletId}`,
      );
    } catch (e) {
      this.notify(e.toString().slice(0, 250));
    }
  }

  async notify(text) {
    this.bot.telegram.sendMessage(config.OWNER_ID, text);
  }
}
