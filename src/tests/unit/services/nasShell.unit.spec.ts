import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { askNasShell, describeNasNotifications, listenNasShell } from '@/services/nasShell';

let originalParent: PropertyDescriptor | undefined;
let parent: { postMessage: ReturnType<typeof vi.fn> };

function arrive(data: unknown) {
  const event = new MessageEvent('message', { data, origin: window.location.origin });
  Object.defineProperty(event, 'source', { value: parent });
  window.dispatchEvent(event);
}

/** Answers the last request of the console with `fields`. */
function answer(fields: Record<string, unknown>) {
  const request = parent.postMessage.mock.calls.at(-1)![0];
  arrive({ nas: 1, type: `${request.type}-result`, requestId: request.requestId, ...fields });
}

beforeEach(() => {
  originalParent = Object.getOwnPropertyDescriptor(window, 'parent');
  parent = { postMessage: vi.fn() };
  Object.defineProperty(window, 'parent', { configurable: true, value: parent });
});

afterEach(() => {
  if (originalParent) {
    Object.defineProperty(window, 'parent', originalParent);
  }
  vi.useRealTimers();
});

it('asks the launcher for the diagnostics and hands back what it answers', async () => {
  const diagnostics = askNasShell<unknown[]>('diagnostics');
  expect(parent.postMessage.mock.calls.at(-1)).toEqual([
    { nas: 1, type: 'diagnostics', requestId: expect.any(String), notification: undefined },
    window.location.origin,
  ]);
  answer({ success: true, data: [{ id: 'one' }] });
  expect(await diagnostics).toEqual([{ id: 'one' }]);

  const log = askNasShell('diagnostic-log', 'one');
  expect(parent.postMessage.mock.calls.at(-1)![0]).toMatchObject({ notification: 'one' });
  answer({ success: false, error: 'Log removed' });
  await expect(log).rejects.toThrow('Log removed');

  const removed = askNasShell('remove-diagnostic', 'one');
  answer({ success: false });
  await expect(removed).rejects.toThrow('Launcher unavailable');
});

it('says the launcher is unavailable outside it or when it never answers', async () => {
  Object.defineProperty(window, 'parent', { configurable: true, value: window });
  await expect(askNasShell('diagnostics')).rejects.toThrow('Launcher unavailable');

  Object.defineProperty(window, 'parent', { configurable: true, value: parent });
  vi.useFakeTimers();
  const late = askNasShell('diagnostics');
  const settled = expect(late).rejects.toThrow('Launcher unavailable');
  await vi.advanceTimersByTimeAsync(10000);
  await settled;
});

it('asks for the labels of the notifications and hears them described', () => {
  const heard = vi.fn();
  const stop = listenNasShell(heard);
  describeNasNotifications([{ id: 'one', title: 't', message: 'm', source: 'nas-launcher' }]);
  expect(parent.postMessage.mock.calls.at(-1)![0]).toMatchObject({ type: 'describe' });
  const described = [{ id: 'one', title: 'Title', message: 'Message', source: 'Launcher' }];
  arrive({ nas: 1, type: 'described', notifications: described });
  expect(heard).toHaveBeenCalledWith({ nas: 1, type: 'described', notifications: described });
  stop();
});
