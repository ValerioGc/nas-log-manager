import { expect, test, type Page } from '@playwright/test';

const entries = [
  {
    id: 'disk-full',
    title: 'Disco pieno',
    message: 'Restano solo 2 GB',
    source: 'storage',
    tone: 'error',
    at: 1_700_000_000_000,
    read: false,
    log: '/var/log/nas-os/install-test.log',
  },
  {
    id: 'backup-done',
    title: 'Backup completato',
    message: 'Tutti i file sono stati salvati',
    source: 'backup',
    tone: 'success',
    at: 1_700_000_100_000,
    read: true,
  },
  {
    id: 'slow-request',
    title: 'Richiesta lenta',
    message: 'Ha richiesto 4 secondi',
    source: 'storage',
    tone: 'warning',
    at: 1_700_000_200_000,
    read: false,
    log: '/var/log/nas-os/warning.log',
  },
];

const log = {
  kind: 'file',
  origin: '/var/log/storage.log',
  lines: ['disk usage reached 98%', 'free space: 2 GB'],
};

/**
 * The launcher, as far as this application can tell: a page that holds it in a frame and answers
 * its requests about the notifications. The application never reaches the launcher otherwise.
 */
async function openInShell(page: Page) {
  await page.route('**/shell.html', (route) =>
    route.fulfill({
      contentType: 'text/html',
      body: `<!doctype html><iframe src="/" title="app" style="width:100%;height:95vh"></iframe>
<script>
  const answers = { diagnostics: ${JSON.stringify(entries)}, 'diagnostic-log': ${JSON.stringify(log)} };
  window.asked = [];
  addEventListener('message', ({ data, source }) => {
    if (!data || data.nas !== 1 || !(data.type in answers)) return;
    window.asked.push(data.type);
    source.postMessage(
      { nas: 1, type: data.type + '-result', requestId: data.requestId, success: true, data: answers[data.type] },
      location.origin,
    );
  });
</script>`,
    }),
  );
  await page.goto('/shell.html');
  return page.frameLocator('iframe');
}

test('filtering notifications by tone and origin updates the visible list', async ({ page }) => {
  const app = await openInShell(page);

  await expect(app.getByRole('heading', { level: 1, name: 'Tutte' })).toBeVisible();
  await expect(app.getByRole('row', { name: /Disco pieno/ })).toBeVisible();
  await expect(app.locator('.summary strong').nth(0)).toHaveText('2');
  await expect(app.locator('.summary strong').nth(1)).toHaveText('1');

  await app.getByRole('button', { name: 'Errori' }).click();
  await expect(app.getByRole('heading', { level: 1, name: 'Errori' })).toBeVisible();
  await expect(app.getByRole('row', { name: /Disco pieno/ })).toBeVisible();
  await expect(app.getByRole('row', { name: /Backup completato/ })).toHaveCount(0);
  await expect(app.locator('.summary strong').nth(0)).toHaveText('1');

  await app.locator('select#origin').selectOption('storage');
  await expect(app.getByRole('row', { name: /Disco pieno/ })).toBeVisible();
  await expect(app.getByRole('row', { name: /Richiesta lenta/ })).toHaveCount(0);
  expect(await page.evaluate(() => (window as unknown as { asked: string[] }).asked)).toEqual([
    'diagnostics',
  ]);
});

test('notification details show log lines and can be closed', async ({ page }) => {
  const app = await openInShell(page);
  const notification = app.getByRole('row', { name: /Disco pieno/ });
  await expect(notification.getByRole('cell').last()).toContainText('Dettagli');
  await notification.getByRole('button', { name: 'Dettagli', exact: true }).click();

  const details = app.getByRole('dialog', { name: 'Dettagli' });
  await expect(details).toBeVisible();
  await expect(details).toHaveJSProperty('open', true);
  const close = details.getByRole('button', { name: 'Chiudi' });
  await expect(close).toBeFocused();
  await notification.locator('.details_button').evaluate((element: HTMLButtonElement) => {
    element.focus();
  });
  await expect(close).toBeFocused();
  await expect(details).toContainText('/var/log/storage.log');
  await expect(details).toContainText('disk usage reached 98%');
  await expect(details).toContainText('free space: 2 GB');

  await details.getByRole('button', { name: 'Chiudi' }).click();
  await expect(details).toHaveCount(0);

  await notification.getByRole('button', { name: 'Dettagli', exact: true }).click();
  await expect(details).toBeVisible();
  await details.press('Escape');
  await expect(details).toHaveCount(0);

  await notification.getByRole('button', { name: 'Dettagli', exact: true }).click();
  await expect(details).toBeVisible();
  await details.click({ position: { x: 5, y: 5 } });
  await expect(details).toHaveCount(0);
});
