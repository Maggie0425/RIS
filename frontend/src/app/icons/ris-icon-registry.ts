import { Injectable, inject } from '@angular/core';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';

const RIS_ICON_NAMES = [
  'account_circle',
  'add',
  'assignment',
  'check_circle',
  'chevron_left',
  'chevron_right',
  'close',
  'dashboard',
  'description',
  'edit',
  'edit_calendar',
  'edit_note',
  'error',
  'event',
  'event_busy',
  'fact_check',
  'group',
  'inbox',
  'info',
  'key',
  'lock',
  'logout',
  'manage_accounts',
  'menu',
  'pending_actions',
  'person',
  'person_add',
  'schedule',
  'search',
  'send',
  'task_alt',
  'touch_app',
  'verified',
  'view_list',
  'visibility',
  'visibility_off',
] as const;

@Injectable({ providedIn: 'root' })
export class RisIconRegistry {
  private readonly iconRegistry = inject(MatIconRegistry);
  private readonly sanitizer = inject(DomSanitizer);
  private registered = false;

  register(): void {
    if (this.registered) return;

    for (const name of RIS_ICON_NAMES) {
      this.iconRegistry.addSvgIcon(
        name,
        this.sanitizer.bypassSecurityTrustResourceUrl(`/icons/${name}.svg`),
      );
    }
    this.registered = true;
  }
}
