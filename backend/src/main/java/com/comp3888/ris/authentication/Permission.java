package com.comp3888.ris.authentication;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "permissions")
class Permission {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, unique = true, length = 100)
    private PermissionCode code;

    @Column(nullable = false, length = 255)
    private String description;

    protected Permission() {
    }

    Long getId() {
        return id;
    }

    PermissionCode getCode() {
        return code;
    }

    String getDescription() {
        return description;
    }
}

