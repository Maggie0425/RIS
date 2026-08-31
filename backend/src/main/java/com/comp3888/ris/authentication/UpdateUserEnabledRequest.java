package com.comp3888.ris.authentication;

import jakarta.validation.constraints.NotNull;

public record UpdateUserEnabledRequest(@NotNull Boolean enabled) {
}
