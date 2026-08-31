package com.comp3888.ris.authentication;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;
import java.util.Set;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class UserManagementServiceTest {
    @Mock UserAccountRepository users;
    @Mock RoleRepository roles;
    @Mock PasswordEncoder passwordEncoder;

    private UserManagementService service;

    @BeforeEach
    void setUp() {
        service = new UserManagementService(users, roles, passwordEncoder);
    }

    @Test
    void createsEnabledUserWithNormalizedUsernameAndHashedPassword() {
        Role receptionist = role(RoleCode.RECEPTIONIST);
        when(users.existsByUsername("new.user")).thenReturn(false);
        when(roles.findByCodeIn(Set.of(RoleCode.RECEPTIONIST))).thenReturn(List.of(receptionist));
        when(passwordEncoder.encode("strong-password")).thenReturn("bcrypt-hash");
        when(users.saveAndFlush(any())).thenAnswer(invocation -> invocation.getArgument(0));

        UserResponse response = service.createUser(new CreateUserRequest(
                " New.User ", " New User ", "strong-password", Set.of(RoleCode.RECEPTIONIST)));

        ArgumentCaptor<UserAccount> captor = ArgumentCaptor.forClass(UserAccount.class);
        verify(users).saveAndFlush(captor.capture());
        UserAccount saved = captor.getValue();
        assertThat(saved.getUsername()).isEqualTo("new.user");
        assertThat(saved.getDisplayName()).isEqualTo("New User");
        assertThat(saved.getPasswordHash()).isEqualTo("bcrypt-hash");
        assertThat(saved.isEnabled()).isTrue();
        assertThat(response.roles()).containsExactly(RoleCode.RECEPTIONIST);
    }

    @Test
    void rejectsDuplicateUsernameBeforeHashing() {
        when(users.existsByUsername("existing")).thenReturn(true);

        assertThatThrownBy(() -> service.createUser(new CreateUserRequest(
                "existing", "Existing User", "strong-password", Set.of(RoleCode.RECEPTIONIST))))
                .isInstanceOf(DuplicateUsernameException.class);
    }

    @Test
    void rejectsUnavailableRoleAssignments() {
        when(roles.findByCodeIn(Set.of(RoleCode.ADMIN, RoleCode.RADIOLOGIST)))
                .thenReturn(List.of(role(RoleCode.ADMIN)));

        assertThatThrownBy(() -> service.createUser(new CreateUserRequest(
                "new-user", "New User", "strong-password",
                Set.of(RoleCode.ADMIN, RoleCode.RADIOLOGIST))))
                .isInstanceOf(InvalidRoleAssignmentException.class);
    }

    @Test
    void replacesRolesCompletely() {
        Role receptionist = role(RoleCode.RECEPTIONIST);
        Role radiologist = role(RoleCode.RADIOLOGIST);
        UserAccount user = user(10L, true, receptionist);
        when(users.findEnabledAdministratorsForUpdate()).thenReturn(List.of(user(1L, true, role(RoleCode.ADMIN))));
        when(users.findByIdForUpdate(10L)).thenReturn(Optional.of(user));
        when(roles.findByCodeIn(Set.of(RoleCode.RADIOLOGIST))).thenReturn(List.of(radiologist));
        when(users.saveAndFlush(user)).thenReturn(user);

        UserResponse response = service.replaceRoles(10L, new UpdateUserRolesRequest(Set.of(RoleCode.RADIOLOGIST)));

        assertThat(response.roles()).containsExactly(RoleCode.RADIOLOGIST);
        assertThat(user.hasRole(RoleCode.RECEPTIONIST)).isFalse();
    }

    @Test
    void preventsRemovingAdminRoleFromFinalEnabledAdministrator() {
        UserAccount admin = user(1L, true, role(RoleCode.ADMIN));
        when(users.findEnabledAdministratorsForUpdate()).thenReturn(List.of(admin));
        when(users.findByIdForUpdate(1L)).thenReturn(Optional.of(admin));
        when(roles.findByCodeIn(Set.of(RoleCode.RECEPTIONIST)))
                .thenReturn(List.of(role(RoleCode.RECEPTIONIST)));

        assertThatThrownBy(() -> service.replaceRoles(
                1L, new UpdateUserRolesRequest(Set.of(RoleCode.RECEPTIONIST))))
                .isInstanceOf(FinalAdministratorException.class)
                .hasMessageContaining("retain the ADMIN role");
    }

    @Test
    void preventsDisablingFinalEnabledAdministrator() {
        UserAccount admin = user(1L, true, role(RoleCode.ADMIN));
        when(users.findEnabledAdministratorsForUpdate()).thenReturn(List.of(admin));
        when(users.findByIdForUpdate(1L)).thenReturn(Optional.of(admin));

        assertThatThrownBy(() -> service.updateEnabled(1L, new UpdateUserEnabledRequest(false)))
                .isInstanceOf(FinalAdministratorException.class)
                .hasMessageContaining("cannot be disabled");
    }

    @Test
    void allowsDisablingAdministratorWhenAnotherEnabledAdminExists() {
        UserAccount first = user(1L, true, role(RoleCode.ADMIN));
        UserAccount second = user(2L, true, role(RoleCode.ADMIN));
        when(users.findEnabledAdministratorsForUpdate()).thenReturn(List.of(first, second));
        when(users.findByIdForUpdate(1L)).thenReturn(Optional.of(first));
        when(users.saveAndFlush(first)).thenReturn(first);

        UserResponse response = service.updateEnabled(1L, new UpdateUserEnabledRequest(false));

        assertThat(response.enabled()).isFalse();
    }

    @Test
    void returnsNotFoundForUnknownUser() {
        when(users.findEnabledAdministratorsForUpdate()).thenReturn(List.of());
        when(users.findByIdForUpdate(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.updateEnabled(99L, new UpdateUserEnabledRequest(false)))
                .isInstanceOf(UserNotFoundException.class);
    }

    private Role role(RoleCode code) {
        Role role = new Role();
        ReflectionTestUtils.setField(role, "code", code);
        ReflectionTestUtils.setField(role, "name", code.name());
        return role;
    }

    private UserAccount user(Long id, boolean enabled, Role... roles) {
        UserAccount user = UserAccount.create("user" + id, "hash", "User " + id, Set.of(roles));
        ReflectionTestUtils.setField(user, "id", id);
        if (!enabled) {
            user.setEnabled(false);
        }
        return user;
    }
}
