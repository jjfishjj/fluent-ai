import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { chromium } from 'playwright';

const port = Number(process.env.E2E_PORT || 4179);
const baseURL = `http://127.0.0.1:${port}`;
const defaultMacChrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const chromePath = process.env.CHROME_PATH || (process.platform === 'darwin' && existsSync(defaultMacChrome) ? defaultMacChrome : undefined);
const server = spawn('npm', ['run', 'dev', '--', '--host', '127.0.0.1', '--port', String(port)], {
  stdio: ['ignore', 'pipe', 'pipe'],
  env: { ...process.env, BROWSER: 'none' },
  detached: process.platform !== 'win32',
});
let serverOutput = '';
server.stdout.on('data', (chunk) => { serverOutput += chunk; });
server.stderr.on('data', (chunk) => { serverOutput += chunk; });

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function stopServer() {
  if (!server.pid || server.exitCode !== null) return;
  if (process.platform === 'win32') server.kill('SIGTERM');
  else process.kill(-server.pid, 'SIGTERM');
  await Promise.race([
    new Promise((resolve) => server.once('exit', resolve)),
    new Promise((resolve) => setTimeout(resolve, 3_000)),
  ]);
}

async function waitForServer() {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    try {
      const response = await fetch(`${baseURL}/practice/number-encoding-demo`);
      if (response.ok) return;
    } catch { /* Server is still starting. */ }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`Demo server did not start.\n${serverOutput}`);
}

const encodingAnswers = ['水母發光游動', '泥巴爆開飛向鏡頭', '和尚旋轉發光', '鯊魚衝出海面', '石山碎裂重組', '狐狸跳過火圈', '律師敲下法槌', '機器人零件飛速組裝', '巴黎鐵塔噴出煙火', '教師揮動巨大教鞭'];
const recallAnswers = ['31', '99', '77', '43', '00', '94', '51', '23', '11', '64'];

let browser;
try {
  await waitForServer();
  browser = await chromium.launch({ headless: true, channel: chromePath ? undefined : 'chrome', executablePath: chromePath, args: ['--enable-webgl', '--use-gl=angle', '--use-angle=swiftshader'] });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' });
  await context.addInitScript(() => {
    localStorage.removeItem('mnemo-verse:number-recall-schedule:v1');
    localStorage.removeItem('mnemo-verse:number-training-attempts:v1');
    Object.defineProperty(navigator, 'vibrate', { value: () => true, configurable: true });
  });
  const page = await context.newPage();
  const consoleErrors = [];
  page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()); });
  page.on('pageerror', (error) => consoleErrors.push(error.message));

  await page.goto(`${baseURL}/practice/number-encoding-demo`, { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: '03 3D 空間戰' }).click();
  await page.getByText('10 組專屬 3D 模型').click();
  assert(await page.getByText('GLB MORPH').count() === 10, '圖鑑應標示完整 10 組 GLB 模型');
  const motionToggle = page.getByRole('button', { name: '切換為靜態記憶組' });
  await motionToggle.click();
  await page.getByRole('button', { name: '切換為動態記憶組' }).click();

  for (let index = 0; index < encodingAnswers.length; index += 1) {
    await page.getByRole('textbox', { name: '輸入聯想到的物件或動態畫面' }).fill(encodingAnswers[index]);
    await page.getByRole('button', { name: '鎖定並啟動 Morph' }).click();
    await page.getByText('轉碼完成！3D 動畫與記憶說明已生成').waitFor();
    await page.getByRole('button', { name: index === 9 ? '進入注意力干擾關' : '下一座編碼艙 →' }).click();
  }

  const gateButton = page.getByRole('button', { name: '進入延遲回想測驗' });
  await page.getByRole('button', { name: '兩碼切塊' }).click();
  assert(await gateButton.isDisabled(), '干擾關答錯後不應解鎖');
  await page.getByRole('button', { name: '逐筆抄寫二十次' }).click();
  assert(await gateButton.isEnabled(), '干擾關答對後應解鎖');
  await gateButton.click();

  const recallInput = page.getByRole('textbox', { name: '輸入兩位數' });
  await recallInput.fill('3');
  assert(await page.getByRole('button', { name: '確認回想' }).isDisabled(), '一位數答案不應允許送出');

  for (let index = 0; index < recallAnswers.length; index += 1) {
    await recallInput.fill(recallAnswers[index]);
    await page.getByRole('button', { name: '確認回想' }).click();
    await page.getByText(index === 1 ? '正確答案是 04' : index === 4 ? '正確答案是 18' : index === 8 ? '正確答案是 80' : '提取成功').waitFor();
    await page.getByRole('button', { name: index === 9 ? '完成本輪回想' : '下一個物件' }).click();
  }

  await page.getByRole('heading', { name: '真正記住了 7/10 組' }).waitFor();
  await page.getByText('本次新增 3 組 × 3 輪').waitFor();
  await page.waitForTimeout(31_000);
  await page.getByRole('button', { name: '開始到期錯題' }).click();

  const scheduledAnswers = ['99', '18', '80'];
  for (let index = 0; index < scheduledAnswers.length; index += 1) {
    await page.getByRole('textbox', { name: '輸入兩位數' }).fill(scheduledAnswers[index]);
    await page.getByRole('button', { name: '確認回想' }).click();
    if (index === 0) await page.getByText('再次答錯，已縮短為 20 秒後優先重試').waitFor();
    else await page.getByText('提取成功').waitFor();
    await page.getByRole('button', { name: index === scheduledAnswers.length - 1 ? '完成本輪回想' : '下一個物件' }).click();
  }

  await page.getByText('高風險重試 1 題').waitFor();
  assert(consoleErrors.length === 0, `瀏覽器發生錯誤：\n${consoleErrors.join('\n')}`);
  console.log('✓ 10 組編碼 → 干擾關 → 10 組延遲回想 → 7/10 結算 → 動態錯題重試');
} finally {
  await browser?.close();
  await stopServer();
}
