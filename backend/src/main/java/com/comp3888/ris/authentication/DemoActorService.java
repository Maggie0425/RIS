package com.comp3888.ris.authentication;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class DemoActorService {

    static final String DEFAULT_ORDER_CREATOR = "receptionist";

    private final UserAccountRepository users;

    DemoActorService(UserAccountRepository users) {
        this.users = users;
    }

    @Transactional(readOnly = true)
    public Long defaultOrderCreatorId() {
        return users.findByUsername(DEFAULT_ORDER_CREATOR)
                .map(UserAccount::getId)
                .orElseThrow(() -> new IllegalStateException(
                        "Demo user '" + DEFAULT_ORDER_CREATOR + "' is required until authentication is wired."));
    }
}
