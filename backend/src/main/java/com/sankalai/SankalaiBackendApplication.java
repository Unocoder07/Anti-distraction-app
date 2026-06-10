package com.sankalai;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@SpringBootApplication
@EnableJpaAuditing
public class SankalaiBackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(SankalaiBackendApplication.class, args);
    }
}
