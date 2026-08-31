package com.comp3888.ris.authentication;

import java.util.Collection;
import java.util.List;

import org.springframework.security.core.CredentialsContainer;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

final class AuthenticatedUser implements UserDetails, CredentialsContainer {

    private final Long id;
    private final String username;
    private String passwordHash;
    private final String displayName;
    private final boolean enabled;
    private final List<String> roles;
    private final List<String> permissions;
    private final List<GrantedAuthority> authorities;

    AuthenticatedUser(
            Long id,
            String username,
            String passwordHash,
            String displayName,
            boolean enabled,
            List<String> roles,
            List<String> permissions) {
        this.id = id;
        this.username = username;
        this.passwordHash = passwordHash;
        this.displayName = displayName;
        this.enabled = enabled;
        this.roles = List.copyOf(roles);
        this.permissions = List.copyOf(permissions);
        this.authorities = createAuthorities(this.roles, this.permissions);
    }

    Long id() {
        return id;
    }

    String displayName() {
        return displayName;
    }

    List<String> roles() {
        return roles;
    }

    List<String> permissions() {
        return permissions;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return authorities;
    }

    @Override
    public String getPassword() {
        return passwordHash;
    }

    @Override
    public String getUsername() {
        return username;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return enabled;
    }

    @Override
    public void eraseCredentials() {
        passwordHash = null;
    }

    private static List<GrantedAuthority> createAuthorities(
            List<String> roles, List<String> permissions) {
        return java.util.stream.Stream.concat(
                        permissions.stream(),
                        roles.stream().map(role -> "ROLE_" + role))
                .distinct()
                .map(SimpleGrantedAuthority::new)
                .map(GrantedAuthority.class::cast)
                .toList();
    }
}
