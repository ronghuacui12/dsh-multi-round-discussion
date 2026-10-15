/**
 * Client half of dsh-multi-model-discussion.
 *
 * Two surfaces:
 *   - settings.section   -> which model plays which role, and how execution runs
 *   - conversation.view  -> the discussion itself, as a group chat
 */
import { injectStyles } from './styles';
import { SettingsSection } from './settings';
import { DiscussionView } from './chat';

export const name = 'multi-model-discussion/client';
export const inject = ['slots'];

export function apply(ctx: any) {
  injectStyles();
  const slots = ctx.slots;
  if (!slots) {
    ctx.logger?.('multi-model-discussion/client')?.info?.('composition has no slots service; the discussion UI is not mounted');
    return;
  }
  slots.inject('settings.section', () =>
    slots.register(
      { name: 'settings.section', id: 'multi-model-discussion', order: 30, label: '研讨模式' },
      SettingsSection,
    ),
  );
  slots.inject('conversation.view', () =>
    slots.register(
      { name: 'conversation.view', id: 'multi-model-discussion', order: 100, label: '多模型研讨' },
      DiscussionView,
    ),
  );
}
