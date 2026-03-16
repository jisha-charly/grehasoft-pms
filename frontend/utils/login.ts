import { Page } from '@playwright/test'

export async function login(page: Page) {

  await page.goto("http://localhost:3000/#/login")

  // Fill username
  await page.getByLabel("Username").fill("admin1")

  // Fill password
  await page.getByLabel("Password").fill("admin@123")

  // Click authenticate
  await page.getByRole("button", { name: "Authenticate" }).click()

  // Wait for dashboard
  await page.waitForURL("**/dashboard")
}