package com.comp3888.ris.authentication;

import java.net.URI;
import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/users")
@PreAuthorize("hasAuthority('USER_MANAGE')")
public class UserManagementController {
    private final UserManagementService service;

    UserManagementController(UserManagementService service) {
        this.service = service;
    }

    @GetMapping
    public List<UserResponse> getUsers() {
        return service.getUsers();
    }

    @PostMapping
    public ResponseEntity<UserResponse> createUser(@Valid @RequestBody CreateUserRequest request) {
        UserResponse response = service.createUser(request);
        return ResponseEntity.created(URI.create("/api/users/" + response.id())).body(response);
    }

    @PutMapping("/{id}/roles")
    public UserResponse replaceRoles(@PathVariable Long id, @Valid @RequestBody UpdateUserRolesRequest request) {
        return service.replaceRoles(id, request);
    }

    @PatchMapping("/{id}/enabled")
    public UserResponse updateEnabled(@PathVariable Long id, @Valid @RequestBody UpdateUserEnabledRequest request) {
        return service.updateEnabled(id, request);
    }
}
