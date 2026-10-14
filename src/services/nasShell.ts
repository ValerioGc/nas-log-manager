import { createNasShell, type NasNotification, type ShellEvent } from '@valeriogc/nas-base-app';

/** What the console asks the launcher, which only it holds. */
export type ShellRequest = 'diagnostics' | 'diagnostic-log' | 'remove-diagnostic';

/** The one bridge of the application to the launcher, its context included. */
export const shell = createNasShell();

export function listenNasShell(listener: (message: ShellEvent) => void): () => void {
  return shell.listen(listener);
}

export function describeNasNotifications(notifications: NasNotification[]): void {
  shell.describeNotifications(notifications);
}

/**
 * Asks the shell for what only the launcher holds: this process never reaches the launcher, the
 * shell answers with the session of the console. Rejects with the reason it gives, or after ten
 * seconds without an answer.
 */
export async function askNasShell<T>(type: ShellRequest, notification?: string): Promise<T> {
  const answer = await shell.request(type, { notification }).catch(() => {
    throw new Error('Launcher unavailable');
  });
  if (!answer.success) {
    throw new Error(answer.error ?? 'Launcher unavailable');
  }
  return answer.data as T;
}
