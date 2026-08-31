package com.comp3888.ris.authentication;

import java.util.EnumSet;
import java.util.List;
import java.util.Set;

import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
class RisUserDetailsService implements UserDetailsService {

    private final UserAccountRepository repository;

    RisUserDetailsService(UserAccountRepository repository) {
        this.repository = repository;
    }

    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        UserAccount account = repository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("Invalid username or password."));

        Set<RoleCode> roleCodes = EnumSet.noneOf(RoleCode.class);
        account.getRoles().forEach(role -> roleCodes.add(role.getCode()));

        Set<PermissionCode> permissionCodes = EnumSet.noneOf(PermissionCode.class);
        if (roleCodes.contains(RoleCode.ADMIN)) {
            permissionCodes.addAll(EnumSet.allOf(PermissionCode.class));
        } else {
            account.getRoles().stream()
                    .flatMap(role -> role.getPermissions().stream())
                    .map(Permission::getCode)
                    .forEach(permissionCodes::add);
        }

        List<String> roles = roleCodes.stream().map(Enum::name).toList();
        List<String> permissions = permissionCodes.stream().map(Enum::name).toList();

        return new AuthenticatedUser(
                account.getId(),
                account.getUsername(),
                account.getPasswordHash(),
                account.getDisplayName(),
                account.isEnabled(),
                roles,
                permissions);
    }
}
