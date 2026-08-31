package com.comp3888.ris;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;

import com.comp3888.ris.support.PostgreSqlTestContainerConfiguration;

@SpringBootTest
@Import(PostgreSqlTestContainerConfiguration.class)
class RisBackendApplicationTests {

	@Test
	void contextLoadsAndJpaSchemaValidates() {
	}

}
