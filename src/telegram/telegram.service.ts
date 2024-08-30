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
    this.bot.command('start', (ctx) => this.start(ctx));
    this.bot.command('run', (ctx) => this.run(ctx));
    this.bot.command('stop', (ctx) => this.stop(ctx));
    this.bot.command('nextWallet', (ctx) => this.nextWallet(ctx));
    this.bot.on(message('text'), (ctx) => this.start(ctx));
    this.bot.launch();
  }

  async start(ctx: Context) {
    if (!(ctx.chat.id === config.OWNER_ID || ctx.chat.id === config.ADMIN_ID)) {
      // console.log(`Ваш id: ${ctx.chat.id}`);
      // await ctx.reply(`Ваш id: ${ctx.chat.id}`);
      return;
    }

    await ctx.reply(`Приветствую`);
  }

  private async run(ctx: Context) {
    if (ctx.chat.id !== config.ADMIN_ID) {
      return;
    }

    this.volumeControlService.slots['SNK'].isRunning = true;
    await this.bot.telegram.sendMessage(
      config.ADMIN_ID,
      'botManager is running now',
    );
  }

  private async stop(ctx: Context) {
    if (ctx.chat.id !== config.ADMIN_ID) {
      return;
    }

    this.volumeControlService.slots['SNK'].isRunning = false;
    await this.bot.telegram.sendMessage(
      config.ADMIN_ID,
      'botManager was stopped',
    );
  }

  private async nextWallet(ctx: Context) {
    if (!(ctx.chat.id === config.ADMIN_ID)) {
      return;
    }

    try {
      const nextId = Number(ctx.text.split(' ')[1]);
      this.volumeControlService.slots['SNK'].incrementWalletId(nextId);
      await this.bot.telegram.sendMessage(
        config.ADMIN_ID,
        `Next wallet id is ${this.volumeControlService.slots['SNK'].walletId}`,
      );
    } catch (e) {
      await this.notifyAdmin(e.toString().slice(0, 250));
    }
  }

  async notify(text: string, id?: string) {
    text = id ? `${text}\n\n#${id}` : text;
    await this.bot.telegram.sendMessage(config.ADMIN_ID, text);
    await this.bot.telegram.sendMessage(config.OWNER_ID, text);
  }

  async notifyAdmin(text: string, id?: string) {
    text = id ? `${text}\n\n#${id}` : text;
    await this.bot.telegram.sendMessage(config.ADMIN_ID, text);
  }
}
