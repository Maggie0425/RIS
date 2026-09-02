import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { ManagedUser } from './user-management';
import { UserManagementApi } from './user-management-api';

describe('UserManagementApi', () => {
  let api: UserManagementApi;
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(UserManagementApi);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('uses the backend user-management contracts', async () => {
    const listResult = firstValueFrom(api.list());
    http.expectOne('/api/users').flush([managedUser()]);
    expect((await listResult)[0].username).toBe('admin');

    const create = firstValueFrom(
      api.create({
        username: 'staff',
        displayName: 'Staff User',
        password: 'strong-password',
        roles: ['RECEPTIONIST'],
      }),
    );
    const createRequest = http.expectOne('/api/users');
    expect(createRequest.request.method).toBe('POST');
    createRequest.flush(managedUser());
    await create;

    const roles = firstValueFrom(api.replaceRoles(1, ['ADMIN']));
    const rolesRequest = http.expectOne('/api/users/1/roles');
    expect(rolesRequest.request.method).toBe('PUT');
    expect(rolesRequest.request.body).toEqual({ roles: ['ADMIN'] });
    rolesRequest.flush(managedUser());
    await roles;

    const enabled = firstValueFrom(api.setEnabled(1, false));
    const enabledRequest = http.expectOne('/api/users/1/enabled');
    expect(enabledRequest.request.method).toBe('PATCH');
    expect(enabledRequest.request.body).toEqual({ enabled: false });
    enabledRequest.flush({ ...managedUser(), enabled: false });
    await enabled;
  });
});

function managedUser(): ManagedUser {
  return {
    id: 1,
    username: 'admin',
    displayName: 'Demo Administrator',
    enabled: true,
    roles: ['ADMIN'],
    createdAt: '2026-08-01T00:00:00Z',
    updatedAt: '2026-08-01T00:00:00Z',
  };
}
