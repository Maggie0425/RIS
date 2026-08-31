package com.comp3888.ris.authentication;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Instant;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import com.comp3888.ris.api.ApiExceptionHandler;

@WebMvcTest(UserManagementController.class)
@Import(ApiExceptionHandler.class)
@AutoConfigureMockMvc(addFilters = false)
class UserManagementControllerTest {
    @Autowired MockMvc mockMvc;
    @MockitoBean UserManagementService service;
    @MockitoBean UserAccountRepository users;

    @Test
    void listsUsersForUserManagerWithoutPasswordHashes() throws Exception {
        Instant now = Instant.parse("2026-08-31T00:00:00Z");
        when(service.getUsers()).thenReturn(List.of(new UserResponse(
                1L, "admin", "Administrator", true, List.of(RoleCode.ADMIN), now, now)));

        mockMvc.perform(get("/api/users"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].username").value("admin"))
                .andExpect(jsonPath("$[0].passwordHash").doesNotExist())
                .andExpect(jsonPath("$[0].password").doesNotExist());
    }

    @Test
    void createsValidUser() throws Exception {
        Instant now = Instant.parse("2026-08-31T00:00:00Z");
        when(service.createUser(any())).thenReturn(new UserResponse(
                5L, "new.user", "New User", true, List.of(RoleCode.RECEPTIONIST), now, now));

        mockMvc.perform(post("/api/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"username":"new.user","displayName":"New User",\
                                "password":"strong-password","roles":["RECEPTIONIST"]}
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.username").value("new.user"));
    }

    @Test
    void rejectsInvalidCreateRequest() throws Exception {
        mockMvc.perform(post("/api/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"username":"x!","displayName":"","password":"short","roles":[]}
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.username").exists())
                .andExpect(jsonPath("$.fieldErrors.displayName").exists())
                .andExpect(jsonPath("$.fieldErrors.password").exists())
                .andExpect(jsonPath("$.fieldErrors.roles").exists());
        verify(service, never()).createUser(any());
    }

    @Test
    void mapsDuplicateUsernameToConflict() throws Exception {
        when(service.createUser(any())).thenThrow(new DuplicateUsernameException("existing"));

        mockMvc.perform(post("/api/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"username":"existing","displayName":"Existing User",\
                                "password":"strong-password","roles":["RECEPTIONIST"]}
                                """))
                .andExpect(status().isConflict());
    }

    @Test
    void mapsUnknownUserAndInvalidRoleAssignment() throws Exception {
        when(service.updateEnabled(any(), any())).thenThrow(new UserNotFoundException(99L));
        when(service.replaceRoles(any(), any())).thenThrow(new InvalidRoleAssignmentException());

        mockMvc.perform(patch("/api/users/99/enabled")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"enabled\":false}"))
                .andExpect(status().isNotFound());
        mockMvc.perform(put("/api/users/1/roles")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"roles\":[\"ADMIN\"]}"))
                .andExpect(status().isBadRequest());
    }
}
