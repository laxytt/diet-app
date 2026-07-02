import { expect, test } from '@playwright/test';

async function waitForApp(page) {
  await page.goto('/');
  await expect(page.locator('.brand-lockup h1')).toHaveText('Nouria');
  await page.waitForLoadState('networkidle').catch(() => {});
}

async function showNativeView(page, view = 'dashboard') {
  await page.evaluate((viewName) => {
    document.documentElement.classList.add('native-app');
    document.documentElement.dataset.theme = 'dark';
    const shell = document.querySelector('.app-shell');
    shell.classList.remove('auth-mode', 'locked', 'auth-loading');
    document.querySelector('#auth-gate').hidden = true;
    document.querySelectorAll('.view').forEach((viewNode) => viewNode.classList.remove('active'));
    document.querySelector(`#view-${viewName}`).classList.add('active');
    window.scrollTo(0, 0);
  }, view);
}

async function tryHorizontalPan(page) {
  await page.mouse.move(360, 760);
  await page.mouse.down();
  await page.mouse.move(30, 760, { steps: 8 });
  await page.mouse.up();
  await page.mouse.move(30, 420);
  await page.mouse.down();
  await page.mouse.move(360, 420, { steps: 8 });
  await page.mouse.up();
  await page.evaluate(() => {
    window.scrollBy(160, 0);
    document.documentElement.scrollLeft = 160;
    document.body.scrollLeft = 160;
  });
  await page.waitForTimeout(80);
}

async function readHorizontalMetrics(page) {
  return page.evaluate(() => {
    const viewportWidth = document.documentElement.clientWidth;
    const scrollWidth = Math.max(document.documentElement.scrollWidth, document.body.scrollWidth);
    const rectFor = (selector) => {
      const element = document.querySelector(selector);
      if (!element) return null;
      const rect = element.getBoundingClientRect();
      return {
        left: Math.round(rect.left),
        right: Math.round(rect.right),
        width: Math.round(rect.width)
      };
    };
    return {
      viewportWidth,
      overflow: scrollWidth - viewportWidth,
      scrollX: Math.round(window.scrollX),
      htmlScrollLeft: Math.round(document.documentElement.scrollLeft),
      bodyScrollLeft: Math.round(document.body.scrollLeft),
      visualViewportLeft: Math.round(window.visualViewport?.pageLeft || 0),
      shell: rectFor('.app-shell'),
      topbar: rectFor('.topbar'),
      activeView: rectFor('.view.active'),
      tabbar: rectFor('.tabbar')
    };
  });
}

test('auth screen is readable and does not expose debug labels', async ({ page }) => {
  await waitForApp(page);

  await expect(page.locator('#auth-gate')).toBeVisible();
  await expect(page.locator('#auth-title')).toHaveText('Zaloguj się');
  await expect(page.locator('.auth-panel-header .stat-chip')).toHaveCount(0);
  const visibleText = await page.locator('body').evaluate((node) => node.innerText);
  expect(visibleText).not.toContain('RAG');
  expect(visibleText).not.toContain('Sync');
});

test('registration keeps resend confirmation in the confirmation step', async ({ page }) => {
  await waitForApp(page);

  await page.locator('#auth-register-tab').click();
  await expect(page.locator('#auth-title')).toHaveText('Utwórz konto');
  await expect(page.locator('#gate-resend-button')).toBeHidden();
});

test('mobile layout has no horizontal overflow', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'Mobile-only layout check');

  await waitForApp(page);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});

test('mobile native screens do not drift sideways', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'Mobile-only layout check');

  await waitForApp(page);
  for (const view of ['dashboard', 'diary', 'plan', 'foods', 'recipes', 'trends', 'import', 'settings']) {
    await showNativeView(page, view);
    await tryHorizontalPan(page);
    const metrics = await readHorizontalMetrics(page);

    expect(metrics.overflow, `${view} overflow`).toBeLessThanOrEqual(1);
    expect(metrics.scrollX, `${view} window.scrollX`).toBe(0);
    expect(metrics.htmlScrollLeft, `${view} html scrollLeft`).toBe(0);
    expect(metrics.bodyScrollLeft, `${view} body scrollLeft`).toBe(0);
    expect(metrics.visualViewportLeft, `${view} visual viewport`).toBe(0);
    for (const key of ['shell', 'topbar', 'activeView', 'tabbar']) {
      expect(metrics[key].left, `${view} ${key} left`).toBeGreaterThanOrEqual(-1);
      expect(metrics[key].right, `${view} ${key} right`).toBeLessThanOrEqual(metrics.viewportWidth + 1);
    }
  }
});

test('mobile native header branding is aligned', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'Mobile-only layout check');

  await waitForApp(page);
  await showNativeView(page, 'diary');

  const alignment = await page.evaluate(() => {
    const mark = document.querySelector('.brand-mark').getBoundingClientRect();
    const title = document.querySelector('.brand-lockup h1').getBoundingClientRect();
    const subtitle = document.querySelector('#today-summary').getBoundingClientRect();
    const topbar = document.querySelector('.topbar').getBoundingClientRect();
    const textBlock = {
      top: title.top,
      bottom: subtitle.bottom,
      left: Math.min(title.left, subtitle.left)
    };
    return {
      gap: Math.round(textBlock.left - mark.right),
      centerDelta: Math.round(Math.abs((mark.top + mark.height / 2) - ((textBlock.top + textBlock.bottom) / 2))),
      markLeft: Math.round(mark.left - topbar.left),
      markTop: Math.round(mark.top - topbar.top),
      markSize: Math.round(mark.width)
    };
  });

  expect(alignment.gap).toBeGreaterThanOrEqual(12);
  expect(alignment.gap).toBeLessThanOrEqual(18);
  expect(alignment.centerDelta).toBeLessThanOrEqual(3);
  expect(alignment.markLeft).toBeGreaterThanOrEqual(7);
  expect(alignment.markTop).toBeGreaterThanOrEqual(7);
  expect(alignment.markSize).toBeGreaterThanOrEqual(34);
  expect(alignment.markSize).toBeLessThanOrEqual(38);
});

test('mobile plan form is not hidden behind bottom navigation', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'Mobile-only layout check');

  await waitForApp(page);
  await showNativeView(page, 'plan');

  await expect(page.locator('#selected-date-label')).toHaveText(/^\d{2}\.\d{2}\.\d{4}$/);

  const planPanelWidth = await page.evaluate(() => {
    const view = document.querySelector('#view-plan').getBoundingClientRect();
    const panel = document.querySelector('.plan-form-panel').getBoundingClientRect();
    return panel.width / view.width;
  });
  expect(planPanelWidth).toBeGreaterThan(0.94);

  const resetButton = page.locator('#reset-planned-meal');
  await resetButton.scrollIntoViewIfNeeded();
  await page.waitForTimeout(100);

  const layout = await resetButton.evaluate((button) => {
    const buttonRect = button.getBoundingClientRect();
    const navRect = document.querySelector('.tabbar').getBoundingClientRect();
    const topElement = document.elementFromPoint(
      buttonRect.left + buttonRect.width / 2,
      buttonRect.top + buttonRect.height / 2
    );
    return {
      buttonIsClickable: topElement === button || button.contains(topElement),
      gapToNav: navRect.top - buttonRect.bottom
    };
  });

  expect(layout.buttonIsClickable).toBe(true);
  expect(layout.gapToNav).toBeGreaterThan(8);
});
