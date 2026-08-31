package com.comp3888.ris.authentication;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserManagementService {
    private final UserAccountRepository users;
    private final RoleRepository roles;
    private final PasswordEncoder passwordEncoder;

    UserManagementService(UserAccountRepository users, RoleRepository roles, PasswordEncoder passwordEncoder) {
        this.users = users;
        this.roles = roles;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional(readOnly = true)
    public List<UserResponse> getUsers() {
        return users.findAllByOrderByUsernameAsc().stream().map(UserResponse::from).toList();
    }

    @Transactional
    public UserResponse createUser(CreateUserRequest request) {
        String username = request.username().trim().toLowerCase(Locale.ROOT);
        if (users.existsByUsername(username)) {
            throw new DuplicateUsernameException(username);
        }

        UserAccount user = UserAccount.create(
                username,
                passwordEncoder.encode(request.password()),
                request.displayName().trim(),
                resolveRoles(request.roles()));
        try {
            return UserResponse.from(users.saveAndFlush(user));
        } catch (DataIntegrityViolationException exception) {
            throw new DuplicateUsernameException(username);
        }
    }

    @Transactional
    public UserResponse replaceRoles(Long id, UpdateUserRolesRequest request) {
        List<UserAccount> enabledAdministrators = users.findEnabledAdministratorsForUpdate();
        UserAccount user = findForUpdate(id);
        Set<Role> replacementRoles = resolveRoles(request.roles());
        boolean removesAdmin = user.isEnabled()
                && user.hasRole(RoleCode.ADMIN)
                && replacementRoles.stream().noneMatch(role -> role.getCode() == RoleCode.ADMIN);
        if (removesAdmin && enabledAdministrators.size() == 1) {
            throw new FinalAdministratorException("The final enabled administrator must retain the ADMIN role.");
        }
        user.replaceRoles(replacementRoles);
        return UserResponse.from(users.saveAndFlush(user));
    }

    @Transactional
    public UserResponse updateEnabled(Long id, UpdateUserEnabledRequest request) {
        List<UserAccount> enabledAdministrators = users.findEnabledAdministratorsForUpdate();
        UserAccount user = findForUpdate(id);
        if (!request.enabled() && user.isEnabled() && user.hasRole(RoleCode.ADMIN)
                && enabledAdministrators.size() == 1) {
            throw new FinalAdministratorException("The final enabled administrator cannot be disabled.");
        }
        user.setEnabled(request.enabled());
        return UserResponse.from(users.saveAndFlush(user));
    }

    private UserAccount findForUpdate(Long id) {
        return users.findByIdForUpdate(id).orElseThrow(() -> new UserNotFoundException(id));
    }

    private Set<Role> resolveRoles(Set<RoleCode> requestedCodes) {
        List<Role> found = roles.findByCodeIn(requestedCodes);
        if (found.size() != requestedCodes.size()) {
            throw new InvalidRoleAssignmentException();
        }
        return new LinkedHashSet<>(found);
    }
}
