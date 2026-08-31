package com.comp3888.ris.authentication;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

interface RoleRepository extends JpaRepository<Role, Long> {

    Optional<Role> findByCode(RoleCode code);

    List<Role> findByCodeIn(Collection<RoleCode> codes);
}
