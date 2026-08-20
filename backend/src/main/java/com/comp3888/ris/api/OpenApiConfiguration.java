package com.comp3888.ris.api;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;

@Configuration
public class OpenApiConfiguration {

    @Bean
    OpenAPI risOpenApi() {
        return new OpenAPI().info(new Info()
                .title("RIS REST API")
                .description("REST API for the self-hosted Radiology Information System")
                .version("v1"));
    }
}
