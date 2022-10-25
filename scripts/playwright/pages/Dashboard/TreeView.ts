import { Locator, expect } from "@playwright/test";
import { DashboardPage } from ".";
import BasePage from "../Base";

export class TreeViewPage extends BasePage {
  readonly dashboard: DashboardPage;
  readonly project: any;
  readonly quickImportButton: Locator;

  constructor(dashboard: DashboardPage, project: any) {
    super(dashboard.rootPage);
    this.dashboard = dashboard;
    this.project = project;
    this.quickImportButton = dashboard.get().locator(".nc-import-menu");
  }

  get() {
    return this.dashboard.get().locator(".nc-treeview-container");
  }

  async focusTable({ title }: { title: string }) {
    await this.get().locator(`.nc-project-tree-tbl-${title}`).focus();
  }

  // assumption: first view rendered is always GRID
  //
  async openTable({ title }: { title: string }) {
    if ((await this.get().locator(".active.nc-project-tree-tbl").count()) > 0) {
      if (
        (await this.get()
          .locator(".active.nc-project-tree-tbl")
          .innerText()) === title
      ) {
        // table already open
        return;
      }
    }

    await this.waitForResponse({
      uiAction: this.get().locator(`.nc-project-tree-tbl-${title}`).click(),
      httpMethodsToMatch: ["GET"],
      requestUrlPathToMatch: `/api/v1/db/meta/tables/`,
      responseJsonMatcher: (json) => json.title === title,
    });
    await this.dashboard.waitForTabRender({ title });
  }

  async createTable({ title }: { title: string }) {
    await this.get().locator(".nc-add-new-table").click();

    await this.dashboard
      .get()
      .locator(".nc-modal-table-create")
      .locator(".ant-modal-body")
      .waitFor();

    await this.dashboard
      .get()
      .locator('[placeholder="Enter table name"]')
      .fill(title);

    await this.waitForResponse({
      uiAction: this.dashboard
        .get()
        .locator('button:has-text("Submit")')
        .click(),
      httpMethodsToMatch: ["POST"],
      requestUrlPathToMatch: `/api/v1/db/meta/projects/`,
      responseJsonMatcher: (json) =>
        json.title === title && json.type === "table",
    });

    await this.dashboard.waitForTabRender({ title });
  }

  async verifyTable({ title, index }: { title: string; index?: number }) {
    await expect(
      this.get().locator(`.nc-project-tree-tbl-${title}`)
    ).toBeVisible();

    if (index) {
      expect(await this.get().locator(".nc-tbl-title").nth(index)).toHaveText(
        title
      );
    }
  }

  async verifyTableDoesNotExist({ title }: { title: string }) {
    await expect(
      await this.get().locator(`.nc-project-tree-tbl-${title}`).count()
    ).toBe(0);
  }

  async deleteTable({ title }: { title: string }) {
    await this.get()
      .locator(`.nc-project-tree-tbl-${title}`)
      .click({ button: "right" });
    await this.dashboard
      .get()
      .locator('div.nc-project-menu-item:has-text("Delete")')
      .click();

    await this.waitForResponse({
      uiAction: this.dashboard.get().locator('button:has-text("Yes")').click(),
      httpMethodsToMatch: ["DELETE"],
      requestUrlPathToMatch: `/api/v1/db/meta/tables/`,
    });

    await expect
      .poll(
        async () =>
          await this.dashboard.tabBar
            .locator(".ant-tabs-tab", {
              hasText: title,
            })
            .isVisible()
      )
      .toBe(false);

    (
      await this.rootPage.locator(".nc-container").last().elementHandle()
    )?.waitForElementState("stable");
  }

  async renameTable({ title, newTitle }: { title: string; newTitle: string }) {
    await this.get()
      .locator(`.nc-project-tree-tbl-${title}`)
      .click({ button: "right" });
    await this.dashboard
      .get()
      .locator('div.nc-project-menu-item:has-text("Rename")')
      .click();
    await this.dashboard
      .get()
      .locator('[placeholder="Enter table name"]')
      .fill(newTitle);
    await this.dashboard.get().locator('button:has-text("Submit")').click();
    await this.toastWait({ message: "Table renamed successfully" });
  }

  async reorderTables({
    sourceTable,
    destinationTable,
  }: {
    sourceTable: string;
    destinationTable: string;
  }) {
    await this.dashboard
      .get()
      .locator(`[pw-data="tree-view-table-draggable-handle-${sourceTable}"]`)
      .dragTo(
        this.get().locator(`[pw-data="tree-view-table-${destinationTable}"]`)
      );
  }

  async quickImport({ title }: { title: string }) {
    await this.get().locator(".nc-add-new-table").hover();
    await this.quickImportButton.click();
    const importMenu = this.dashboard.get().locator(".nc-dropdown-import-menu");
    await importMenu
      .locator(`.ant-dropdown-menu-title-content:has-text("${title}")`)
      .click();
  }

  async validateRoleAccess(param: { role: string }) {
    // Add new table button
    expect(await this.get().locator(`.nc-add-new-table`).count()).toBe(
      param.role === "creator" ? 1 : 0
    );
    // Import menu
    expect(await this.get().locator(`.nc-import-menu`).count()).toBe(
      param.role === "creator" ? 1 : 0
    );
    // Invite Team button
    expect(await this.get().locator(`.nc-share-base`).count()).toBe(
      param.role === "creator" ? 1 : 0
    );
    // Right click context menu
    await this.get().locator(`.nc-project-tree-tbl-Country`).click({
      button: "right",
    });
    expect(
      await this.rootPage
        .locator(`.nc-dropdown-tree-view-context-menu:visible`)
        .count()
    ).toBe(param.role === "creator" ? 1 : 0);
  }
}
