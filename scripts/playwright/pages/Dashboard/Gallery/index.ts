// playwright-dev-page.ts
import { Locator, expect } from "@playwright/test";
import { DashboardPage } from "..";
import BasePage from "../../Base";
import { ToolbarPage } from "../common/Toolbar";

export class GalleryPage extends BasePage {
  readonly dashboard: DashboardPage;
  readonly toolbar: ToolbarPage;

  constructor(dashboard: DashboardPage) {
    super(dashboard.rootPage);
    this.dashboard = dashboard;
    this.toolbar = new ToolbarPage(this);
  }

  get() {
    return this.dashboard.get().locator('[data-pw="nc-gallery-wrapper"]');
  }

  card(index: number) {
    return this.get().locator(`.ant-card`).nth(index);
  }

  async openExpandedRow({ index }: { index: number }) {
    await this.card(index).click();
    await (
      await this.rootPage.locator(".ant-drawer-body").elementHandle()
    )?.waitForElementState("stable");
  }

  async verifyRowCount(param: { count: number }) {
    return;
  }

  // kludge: move toolbar outside grid scope
  async fields({ title }: { title: string }) {
    await this.rootPage.locator(`.nc-fields-menu-btn`).click();
    await this.rootPage.waitForTimeout(1000);
    await this.rootPage
      .locator(`[pw-data="nc-fields-menu-${title}"]`)
      .locator('input[type="checkbox"]')
      .click();
    await this.rootPage.waitForTimeout(1000);
    await this.rootPage.locator(`.nc-fields-menu-btn`).click();
  }

  // todo: Wait for render to complete
  async waitLoading() {
    await this.rootPage.waitForTimeout(1000);
  }
}