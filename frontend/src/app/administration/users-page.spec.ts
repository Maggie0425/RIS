import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';
import { UserManagementApi } from './user-management-api';
import { UsersPage } from './users-page';

describe('UsersPage', () => {
  let fixture: ComponentFixture<UsersPage>;
  const api = { list: vi.fn() };
  const dialog = { open: vi.fn() };
  beforeEach(async () => {
    api.list.mockReturnValue(
      of([
        {
          id: 1,
          username: 'admin',
          displayName: 'Demo Administrator',
          enabled: true,
          roles: ['ADMIN'],
          createdAt: '2026-08-01T00:00:00Z',
          updatedAt: '2026-08-01T00:00:00Z',
        },
      ]),
    );
    await TestBed.configureTestingModule({
      imports: [UsersPage],
      providers: [
        { provide: UserManagementApi, useValue: api },
        { provide: MatDialog, useValue: dialog },
      ],
    }).compileComponents();
  });
  afterEach(() => vi.clearAllMocks());

  it('renders staff accounts and management actions', () => {
    fixture = TestBed.createComponent(UsersPage);
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Demo Administrator');
    expect(text).toContain('Administrator');
    expect(text).toContain('Enabled');
    expect(text).toContain('Edit roles');
    expect(text).toContain('Disable');
  });

  it('shows an error when accounts cannot be loaded', () => {
    api.list.mockReturnValue(throwError(() => new Error('offline')));
    fixture = TestBed.createComponent(UsersPage);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="alert"]').textContent).toContain(
      'could not be loaded',
    );
  });
});
