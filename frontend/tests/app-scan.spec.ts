import { test, expect } from '@playwright/test'
import { login } from '../utils/login'

test('Project CRUD', async ({ page }) => {

  await login(page)

  await page.goto("http://localhost:3000/#/projects")

  // Create Project
  await page.click('button:has-text("Add Project")')

  await page.fill('input[name="name"]', "Test Project")
  await page.fill('textarea[name="description"]', "Automation Test")

  await page.click('button:has-text("Save")')

  await expect(page.locator("text=Test Project")).toBeVisible()

  // Edit Project
  await page.click('text=Test Project')
  await page.fill('input[name="name"]', "Updated Project")

  await page.click('button:has-text("Update")')

  await expect(page.locator("text=Updated Project")).toBeVisible()

  // Delete Project
  await page.click('button:has-text("Delete")')
  await page.click('button:has-text("Confirm")')

})