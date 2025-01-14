import { Directive, HostBinding, Injector, OnDestroy, OnInit } from '@angular/core';
import { AbstractControl } from '@angular/forms';
import { AuthHelperService } from 'app/core/auth-helper.service';
import { CacheService } from 'app/core/cache.service';
import { ConfirmationService } from 'app/core/confirmation.service';
import { FieldHelperService } from 'app/core/field-helper.service';
import { NextRequestState } from 'app/core/next-request-state';
import { ArrowsHorizontal, ArrowsVertical, End, Home, PageDown, PageUp } from 'app/core/shortcut.service';
import { HeadingAction } from 'app/shared/action';
import { BaseComponent } from 'app/shared/base.component';
import { FormControlLocator } from 'app/shared/form-control-locator';
import { handleKeyboardFocus, handleKeyboardScroll, scrollTop } from 'app/shared/helper';
import { BreadcrumbService } from 'app/ui/core/breadcrumb.service';
import { ExportHelperService } from 'app/ui/core/export-helper.service';
import { LoginService } from 'app/ui/core/login.service';
import { MenuService } from 'app/ui/core/menu.service';
import { UiLayoutService } from 'app/ui/core/ui-layout.service';
import { ActiveMenu, Menu } from 'app/ui/shared/menu';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';

export type UpdateTitleFrom = 'menu' | 'content';

/**
 * Base class implemented by components which are actually 'pages', that is, are displayed in the `<router-outlet>`.
 * Pages generally fetch some data from the server in order to display its content.
 * @param D The data type
 */
@Directive()
export abstract class BasePageComponent<D> extends BaseComponent implements OnInit, OnDestroy {
  confirmation: ConfirmationService;
  uiLayout: UiLayoutService;
  cache: CacheService;
  menu: MenuService;
  login: LoginService;
  exportHelper: ExportHelperService;
  breadcrumb: BreadcrumbService;
  authHelper: AuthHelperService;
  fieldHelper: FieldHelperService;

  @HostBinding('style.display') styleDisplay = 'flex';
  @HostBinding('style.flex-direction') styleFlexDirection = 'column';
  @HostBinding('style.flex-grow') styleFlexGrow = '1';

  data$ = new BehaviorSubject<D>(null);
  get data(): D {
    return this.data$.value;
  }
  set data(data: D) {
    if (this.data == null && data != null) {
      this.onDataInitialized(data);
      const menu = this.resolveMenu(data);
      if (menu instanceof Observable) {
        this.addSub(menu.subscribe(m => this.initializeMenu(m)));
      } else {
        this.initializeMenu(menu);
      }
    }
    this.data$.next(data);
  }

  headingActions$ = new BehaviorSubject<HeadingAction[]>(null);
  get headingActions(): HeadingAction[] {
    return this.headingActions$.value;
  }
  set headingActions(headingActions: HeadingAction[]) {
    this.headingActions$.next(headingActions);
  }

  private initializeMenu(menu: Menu | ActiveMenu) {
    if (menu == null) {
      // Leave the current menu if nothing is set
      return;
    }
    // Maybe set the layout title from the menu
    if (this.updateTitleFrom() === 'menu') {
      this.uiLayout.title = null;
      if (this.layout.gtxxs) {
        const entry = this.menu.menuEntry(menu);
        if (entry) {
          this.uiLayout.title = entry.label;
        }
      }
    }
    // Only update the active menu if no menu is set - after a page refresh
    if (!this.menu.activeMenu) {
      this.menu.setActiveMenu(menu);
    }
  }

  /**
   * Reloads the current page
   */
  reload() {
    this.router.navigateByUrl(this.router.url);
  }

  /**
   * Callback invoked the first time the data is initialized
   * @param _data The data instance
   */
  protected onDataInitialized(_data: D) {}

  /**
   * Must be implemented to resolve the active menu item for the current page
   */
  abstract resolveMenu(data: D): Menu | ActiveMenu | Observable<ActiveMenu | Menu>;

  constructor(injector: Injector) {
    super(injector);
    this.confirmation = injector.get(ConfirmationService);
    this.uiLayout = injector.get(UiLayoutService);
    this.cache = injector.get(CacheService);
    this.menu = injector.get(MenuService);
    this.login = injector.get(LoginService);
    this.exportHelper = injector.get(ExportHelperService);
    this.breadcrumb = injector.get(BreadcrumbService);
    this.authHelper = injector.get(AuthHelperService);
    this.fieldHelper = injector.get(FieldHelperService);
  }

  ngOnInit() {
    super.ngOnInit();
    // Clear the previous title
    this.uiLayout.title = null;
    this.uiLayout.currentPage = this;
    this.uiLayout.fullWidth = this.defaultFullWidthLayout();

    // Workaround for https://github.com/angular/angular/issues/22324
    // Assume that when changing page, no requests are pending
    this.injector.get(NextRequestState).clearRequests();

    // Initially scroll the window to the top
    scrollTop();
  }

  /**
   * Adds shortcut listeners to emulate the keyboard navigation on mobile / KaiOS.
   * Handles 2 hinds of keys:
   *
   * - ArrowUp / ArrowDown to handle vertical scroll
   * - ArrowLeft / ArrowRight to focus the previous / next field
   */
  emulateKeyboardScroll(): Subscription {
    const sub1 = this.addShortcut([...ArrowsVertical, PageUp, PageDown, Home, End], e =>
      handleKeyboardScroll(this.layout, e)
    );

    // And also switch between links using the horizontal arrows
    const sub2 = this.addShortcut(ArrowsHorizontal, e =>
      handleKeyboardFocus(this.layout, this.element, e, { horizontalOffset: 1, verticalOffset: 0 })
    );

    return new Subscription(() => {
      sub1.unsubscribe();
      sub2.unsubscribe();
    });
  }

  ngOnDestroy(): void {
    super.ngOnDestroy();
    if (this.uiLayout.currentPage === this) {
      this.uiLayout.currentPage = null;
    }
  }

  /**
   * Should be implemented by pages to correctly locate a form control.
   * Is important, for example, to match validation errors to fields.
   */
  locateControl(_locator: FormControlLocator): AbstractControl {
    return null;
  }

  /**
   * May be overritten in order to determine whether the layout should be full width
   */
  protected defaultFullWidthLayout(): boolean {
    return false;
  }

  /**
   * Indicates whether the window title is updated from the menu or from a page content
   */
  updateTitleFrom(): UpdateTitleFrom {
    return 'content';
  }
}
