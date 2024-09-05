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
    this.notifyAdmin('BotManager is starting');
  }

  async longPolling() {
    this.bot = new Telegraf(config.BOT_TOKEN);
    this.bot.command('start', (ctx) => this.start(ctx));
    this.bot.command('run', (ctx) => this.run(ctx));
    this.bot.command('stop', (ctx) => this.stop(ctx));
    this.bot.command('nextWallet', (ctx) => this.nextWallet(ctx));
    this.bot.command('getIds', (ctx) => this.getIds(ctx));
    this.bot.on(message('text'), (ctx) => this.start(ctx));
    this.bot.launch();
  }

  private parseArg(ctx: Context, argId: number) {
    const arg = ctx.text.split(' ')[argId];
    return arg;
  }

  private async parseProject(ctx: Context, id = 1) {
    const chatId = ctx.chat.id;

    const projectId = this.parseArg(ctx, id);
    const projectSlot = this.volumeControlService.slots[projectId];
    if (!projectSlot) {
      await this.bot.telegram.sendMessage(
        chatId,
        `project was not found by id: ${projectId}`,
      );
    }
    return projectSlot;
  }

  private async parseNumber(ctx: Context, id = 1) {
    const chatId = ctx.chat.id;

    const number = Number(this.parseArg(ctx, id));
    if (!number) {
      await this.bot.telegram.sendMessage(chatId, `Number was not found`);
    }
    return number;
  }

  private ownerOrAdmin(ctx: Context) {}

  private onlyAdmin(ctx: Context) {}

  private async start(ctx: Context) {
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

    const projectSlot = await this.parseProject(ctx);

    if (!projectSlot) {
      return;
    }

    projectSlot.run();
  }

  private async stop(ctx: Context) {
    if (ctx.chat.id !== config.ADMIN_ID) {
      return;
    }

    const projectSlot = await this.parseProject(ctx);

    if (!projectSlot) {
      return;
    }

    projectSlot.stop();
  }

  private async nextWallet(ctx: Context) {
    const chatId = ctx.chat.id;
    if (!(chatId === config.ADMIN_ID)) {
      return;
    }

    try {
      const projectSlot = await this.parseProject(ctx);
      const nextId = await this.parseNumber(ctx, 2);

      if (!projectSlot || !nextId) {
        return;
      }

      projectSlot.incrementWalletId(nextId);

      await this.bot.telegram.sendMessage(
        chatId,
        `Next wallet id is ${projectSlot.walletId}`,
      );
    } catch (e) {
      await this.notifyAdmin(e.toString().slice(0, 250));
    }
  }

  private async getIds(ctx: Context) {
    const chatId = ctx.chat.id;
    if (!(chatId === config.ADMIN_ID)) {
      return;
    }

    await this.bot.telegram.sendMessage(
      chatId,
      Object.keys(this.volumeControlService.slots).join('\n'),
    );
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
