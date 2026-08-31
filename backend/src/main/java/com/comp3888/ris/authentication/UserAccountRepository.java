package com.comp3888.ris.authentication;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import jakarta.persistence.LockModeType;

interface UserAccountRepository extends JpaRepository<UserAccount, Long> {

    @EntityGraph(attributePaths = {"roles", "roles.permissions"})
    Optional<UserAccount> findByUsername(String username);

    boolean existsByUsername(String username);

    @EntityGraph(attributePaths = "roles")
    List<UserAccount> findAllByOrderByUsernameAsc();

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select distinct user from UserAccount user left join fetch user.roles where user.id = :id")
    Optional<UserAccount> findByIdForUpdate(@Param("id") Long id);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            select distinct user
            from UserAccount user
            join fetch user.roles role
            where user.enabled = true and role.code = com.comp3888.ris.authentication.RoleCode.ADMIN
            order by user.id
            """)
    List<UserAccount> findEnabledAdministratorsForUpdate();
}
