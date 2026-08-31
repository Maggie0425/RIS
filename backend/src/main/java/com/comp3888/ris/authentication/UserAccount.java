package com.comp3888.ris.authentication;

import java.time.Instant;
import java.util.LinkedHashSet;
import java.util.Set;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.Table;

@Entity
@Table(name = "users")
class UserAccount {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 100)
    private String username;

    @Column(name = "password_hash", nullable = false, length = 255)
    private String passwordHash;

    @Column(name = "display_name", nullable = false, length = 200)
    private String displayName;

    @Column(nullable = false)
    private boolean enabled;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @ManyToMany
    @JoinTable(
            name = "user_roles",
            joinColumns = @JoinColumn(name = "user_id"),
            inverseJoinColumns = @JoinColumn(name = "role_id"))
    private Set<Role> roles = new LinkedHashSet<>();

    protected UserAccount() {
    }

    static UserAccount create(String username, String passwordHash, String displayName, Set<Role> roles) {
        UserAccount user = new UserAccount();
        user.username = username;
        user.passwordHash = passwordHash;
        user.displayName = displayName;
        user.enabled = true;
        user.roles.addAll(roles);
        Instant now = Instant.now();
        user.createdAt = now;
        user.updatedAt = now;
        return user;
    }

    void replaceRoles(Set<Role> replacementRoles) {
        roles.clear();
        roles.addAll(replacementRoles);
        updatedAt = Instant.now();
    }

    void setEnabled(boolean enabled) {
        this.enabled = enabled;
        updatedAt = Instant.now();
    }

    boolean hasRole(RoleCode roleCode) {
        return roles.stream().anyMatch(role -> role.getCode() == roleCode);
    }

    Long getId() {
        return id;
    }

    String getUsername() {
        return username;
    }

    String getPasswordHash() {
        return passwordHash;
    }

    String getDisplayName() {
        return displayName;
    }

    boolean isEnabled() {
        return enabled;
    }

    Instant getCreatedAt() {
        return createdAt;
    }

    Instant getUpdatedAt() {
        return updatedAt;
    }

    Set<Role> getRoles() {
        return Set.copyOf(roles);
    }
}
