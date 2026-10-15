// Drives the production build with the demo account: smoke-tests vault creation, encryption at rest, lock/unlock, items, TOTP, generator, audit, backup AND captures product shots.
import fs from "node:fs"; import assert from "node:assert/strict";
import { withApp, demoPage, out } from "./shotlib.mjs";
const dir = out("onepasswordisdead"); const pub = new URL("../public/home/", import.meta.url).pathname; fs.mkdirSync(pub, { recursive: true });
const save = async (page, name, home = true) => { await page.screenshot({ path: `${dir}/${name}.png` }); if (home) fs.copyFileSync(`${dir}/${name}.png`, `${pub}${name}.png`); };
const PW = "demo-master-password-2026", PW2 = "a-brand-new-master-phrase-77";
await withApp("onepasswordisdead", async ({ base, browser }) => {
  const { ctx, page } = await demoPage(browser, base, { w: 1440, h: 900 });
  // --- create the vault
  await page.getByRole("form", { name: "Create your vault" }).waitFor(); await save(page, "setup", false);
  await page.getByLabel("Master password", { exact: true }).fill("short"); await page.getByRole("button", { name: "Create vault" }).click(); assert.match(await page.locator('p[role="alert"]').innerText(), /at least 10/);
  await page.getByLabel("Master password", { exact: true }).fill("a-long-enough-password"); await page.getByLabel("Confirm master password").fill("different-password-1"); await page.getByRole("button", { name: "Create vault" }).click(); assert.match(await page.locator('p[role="alert"]').innerText(), /don't match/);
  await page.getByRole("button", { name: "Fill in a demo master password" }).click(); await page.getByRole("button", { name: "Create vault" }).click();
  const rows = page.getByTestId("item-row"); const row = t => rows.filter({ has: page.locator("b", { hasText: new RegExp(`^${t}$`) }) }); await rows.first().waitFor(); assert.equal(await rows.count(), 8);
  // --- encryption at rest: no plaintext anywhere in storage
  const stored = await page.evaluate(() => JSON.stringify(Object.fromEntries(Object.entries(localStorage)))); assert.ok(stored.includes("onepasswordisdead:")); for (const secret of ["r7#Vq2", "Mailbox", "summer2020", "4242424242424242", "JBSWY3DP", PW]) assert.ok(!stored.includes(secret), `plaintext leaked: ${secret}`);
  const blob = JSON.parse(await page.evaluate(() => Object.entries(localStorage).find(([k]) => k.endsWith(":vault"))[1])); assert.equal(blob.v, 1); assert.equal(blob.iter, 600000); assert.ok(blob.ct.length > 100);
  // --- item detail, reveal, totp
  await row("Mailbox").click(); const secret = page.getByTestId("secret-password"); assert.match(await secret.innerText(), /^•+$/);
  await page.getByRole("button", { name: "Reveal password" }).click(); assert.equal((await secret.innerText()).trim(), "r7#Vq2!mLw9$Zc4xPe8T"); await page.getByRole("button", { name: "Hide password" }).click(); assert.match(await secret.innerText(), /^•+$/);
  assert.match((await page.getByTestId("totp").innerText()).replace(/\s/g, ""), /^\d{6}$/);
  await rows.first().click(); await row("Mailbox").click(); await save(page, "vault");
  // --- search, favorites, tags
  await page.getByLabel("Search items").fill("chat"); assert.equal(await rows.count(), 1); await page.getByLabel("Search items").fill("summer2020"); assert.equal(await rows.count(), 0); await page.getByLabel("Search items").fill("");
  await page.getByRole("button", { name: /Favorites/ }).click(); assert.equal(await rows.count(), 2); await page.getByRole("button", { name: /^#work/ }).click(); assert.equal(await rows.count(), 2); await page.getByRole("button", { name: /^All items/ }).click();
  await page.keyboard.press("/"); assert.equal(await page.evaluate(() => document.activeElement?.getAttribute("aria-label")), "Search items"); await page.keyboard.press("Escape");
  // --- new login with generated password, invalid totp, then valid
  await page.getByTestId("new-item").click(); await page.getByRole("menuitem", { name: /Login/ }).click(); await page.getByLabel("Title").fill("Bank"); await page.getByLabel("Username").fill("tommy"); await page.getByRole("button", { name: "Generate" }).click(); await page.getByRole("button", { name: "Use a new password" }).click();
  const pw = await page.getByLabel("Password", { exact: true }).inputValue(); assert.equal(pw.length, 20); assert.match(await page.getByRole("img", { name: /Password strength/ }).getAttribute("aria-label"), /Excellent|Strong/);
  await page.getByLabel("One-time password secret (base32)").fill("not*base32"); await page.getByRole("button", { name: "Save" }).click(); assert.match(await page.locator('p[role="alert"]').innerText(), /isn't valid base32/);
  await page.getByLabel("One-time password secret (base32)").fill("JBSWY3DPEHPK3PXP"); await page.getByLabel("Tags (comma separated)").fill("money, work"); await page.getByRole("button", { name: "Save" }).click(); await page.getByTestId("detail").waitFor(); assert.equal(await rows.count(), 9);
  // --- card checksum warning
  await page.getByTestId("new-item").click(); await page.getByRole("menuitem", { name: /Card/ }).click(); await page.getByLabel("Title").fill("Spare card"); await page.getByLabel("Card number").fill("4242424242424241"); assert.match(await page.locator(".op-warnt").innerText(), /checksum/); await page.getByRole("button", { name: "Cancel" }).click();
  // --- delete (confirm)
  await row("Bank").click(); page.once("dialog", d => d.accept()); await page.getByRole("button", { name: "Delete" }).click(); await page.waitForTimeout(150); assert.equal(await rows.count(), 8);
  // --- audit
  await page.getByTestId("nav-audit").click(); const audit = page.getByTestId("audit"); await audit.waitFor(); const at = await audit.innerText(); assert.match(at, /Old forum/); assert.match(at, /Photo storage/); assert.match(at, /Pizza club/); await save(page, "audit");
  await page.route("https://api.pwnedpasswords.com/**", r => r.fulfill({ status: 200, body: "0000000000000000000000000000000000A:1\n" })); await page.getByRole("button", { name: /Check for breached/ }).click(); await page.getByText(/None of your passwords were found/).waitFor();
  // --- generator
  await page.getByTestId("nav-generator").click(); const g = page.getByTestId("generated"); const genLen = n => page.waitForFunction(n => document.querySelector('[data-testid="generated"]')?.textContent?.length === n, n); await genLen(20); assert.equal((await g.innerText()).length, 20); await page.getByLabel("Length").fill("32"); await genLen(32); assert.equal((await g.innerText()).length, 32); await save(page, "generator");
  await page.getByRole("tab", { name: "Passphrase" }).click(); await page.waitForFunction(() => document.querySelector('[data-testid="generated"]')?.textContent?.split("-").length === 5); assert.equal((await g.innerText()).split("-").length, 5);
  // --- settings: backup is ciphertext, wrong current password rejected, change works
  await page.getByTestId("nav-settings").click(); const dlp = page.waitForEvent("download"); await page.getByRole("button", { name: "Download encrypted backup" }).click(); const f = await dlp; await f.saveAs(`${dir}/backup.json`); const bk = fs.readFileSync(`${dir}/backup.json`, "utf8"); assert.ok(!bk.includes("Mailbox") && !bk.includes("summer2020")); assert.equal(JSON.parse(bk).v, 1);
  const form = page.getByRole("form", { name: "Change master password" }); await form.getByLabel("Current master password").fill("wrong-password-123"); await form.getByLabel("New master password").fill(PW2); await form.getByLabel("Confirm new password").fill(PW2); await form.getByRole("button", { name: "Change password" }).click(); await form.getByRole("alert").waitFor(); assert.match(await form.getByRole("alert").innerText(), /current master password is wrong/);
  await form.getByLabel("Current master password").fill(PW); await form.getByRole("button", { name: "Change password" }).click(); await page.getByTestId("toast").filter({ hasText: "Master password changed" }).waitFor();
  const csvp = page.waitForEvent("download"); page.once("dialog", d => d.accept()); await page.getByRole("button", { name: /Export as CSV/ }).click(); const cf = await csvp; await cf.saveAs(`${dir}/export.csv`); assert.match(fs.readFileSync(`${dir}/export.csv`, "utf8"), /Mailbox/);
  await page.setInputFiles('[data-testid="import-csv"]', { name: "chrome.csv", mimeType: "text/csv", buffer: Buffer.from("name,url,username,password,note\nGitHub,https://github.com,me,pw-one-two-three,\nGitLab,https://gitlab.com,me,another-secret,hello\n") }); await page.getByTestId("toast").filter({ hasText: "Imported 2 logins" }).waitFor();
  // --- lock, wrong password, old password rejected, new password works
  await page.getByTestId("lock").click(); await page.getByRole("form", { name: "Unlock your vault" }).waitFor(); await page.getByLabel("Master password").fill("nope-nope-nope"); await page.getByRole("button", { name: "Unlock" }).click(); await page.locator('p[role="alert"]').waitFor(); assert.match(await page.locator('p[role="alert"]').innerText(), /didn't work/);
  await page.getByLabel("Master password").fill(PW); await page.getByRole("button", { name: "Unlock" }).click(); await page.locator('p[role="alert"]').waitFor(); await page.waitForTimeout(900);
  await page.getByLabel("Master password").fill(PW2); await page.getByRole("button", { name: "Unlock" }).click(); await rows.first().waitFor(); assert.equal(await rows.count(), 10);
  // --- reload requires the password again; data persisted
  await page.reload(); await page.getByRole("form", { name: "Unlock your vault" }).waitFor(); await page.getByLabel("Master password").fill(PW2); await page.getByRole("button", { name: "Unlock" }).click(); await rows.first().waitFor(); assert.equal(await rows.count(), 10);
  // --- erase and restore from the (old-password) backup
  await page.getByTestId("nav-settings").click(); page.once("dialog", d => d.accept()); await page.getByRole("button", { name: "Erase vault" }).click(); await page.getByRole("form", { name: "Create your vault" }).waitFor();
  await page.setInputFiles('[data-testid="restore-file"]', `${dir}/backup.json`); await page.getByRole("form", { name: "Unlock your vault" }).waitFor(); await page.getByLabel("Master password").fill(PW); await page.getByRole("button", { name: "Unlock" }).click(); await page.getByRole("button", { name: /^All items/ }).click(); await rows.first().waitFor(); assert.equal(await rows.count(), 8);
  // --- auto-lock (fake clock in a fresh context)
  const c2 = await browser.newContext({ viewport: { width: 1200, height: 800 } }); const p2 = await c2.newPage(); await p2.clock.install();
  await p2.goto(base + "/login"); await p2.getByRole("button", { name: "Use the demo account" }).click(); await p2.waitForURL(/\/app/); await p2.getByRole("button", { name: "Fill in a demo master password" }).click(); await p2.getByRole("button", { name: "Create vault" }).click(); await p2.getByTestId("item-row").first().waitFor();
  await p2.clock.fastForward(5 * 60_000 + 2000); await p2.getByRole("form", { name: "Unlock your vault" }).waitFor(); await c2.close();
  // --- mobile
  const m = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 }); const mp = await m.newPage();
  await mp.goto(base + "/login"); await mp.getByRole("button", { name: "Use the demo account" }).click(); await mp.waitForURL(/\/app/); await mp.screenshot({ path: `${dir}/mobile-app.png` }); await m.close();
  const hp = await ctx.newPage(); await hp.setViewportSize({ width: 1440, height: 900 }); await hp.goto(base); await hp.screenshot({ path: `${dir}/home-top.png` }); await hp.screenshot({ path: `${dir}/home-full.png`, fullPage: true });
  await ctx.clearCookies(); await hp.goto(base + "/login"); await hp.screenshot({ path: `${dir}/login.png` });
  console.log("onepasswordisdead smoke OK");
});
