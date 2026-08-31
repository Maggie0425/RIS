package com.comp3888.ris.authentication;

import java.util.Set;

import jakarta.validation.constraints.NotEmpty;

public record UpdateUserRolesRequest(@NotEmpty Set<RoleCode> roles) {
}
