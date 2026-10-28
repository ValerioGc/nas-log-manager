import { createNasShell, type NasNotification, type ShellEvent } from '@valeriogc/nas-base-app';

/** Requests answered by the launcher shell */
export type ShellRequest = 'diagnostics' | 'diagnostic-log' | 'remove-diagnostic';

/** Single bridge to the launcher shared by the whole app */
export const shell = createNasShell();

export function listenNasShell(listener: (message: ShellEvent) => void): () => void {
  return shell.listen(listener);
}

export function describeNasNotifications(notifications: NasNotification[]): void {
  shell.describeNotifications(notifications);
}

/**
 * Sends a request to the launcher shell and returns its data.
 * Rejects with the shell error, or after ten seconds without an answer.
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
