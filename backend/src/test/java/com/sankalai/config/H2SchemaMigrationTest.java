package com.sankalai.config;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.boot.DefaultApplicationArguments;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DriverManagerDataSource;

class H2SchemaMigrationTest {

    @Test
    void repairsStaleDailyChallengeTypeCheckConstraint() throws Exception {
        DriverManagerDataSource dataSource = new DriverManagerDataSource(
                "jdbc:h2:mem:h2_schema_migration_test;DB_CLOSE_DELAY=-1",
                "sa",
                "");
        dataSource.setDriverClassName("org.h2.Driver");

        JdbcTemplate jdbcTemplate = new JdbcTemplate(dataSource);
        jdbcTemplate.execute("""
                CREATE TABLE daily_challenges (
                    id VARCHAR(255) PRIMARY KEY,
                    type VARCHAR(255) NOT NULL,
                    CONSTRAINT CONSTRAINT_1C CHECK (type IN ('SESSION', 'TIME', 'STREAK', 'BLOCKING', 'DEEP_WORK'))
                )
                """);

        H2SchemaMigration migration = new H2SchemaMigration(dataSource, jdbcTemplate);
        migration.run(new DefaultApplicationArguments());

        jdbcTemplate.update("INSERT INTO daily_challenges (id, type) VALUES (?, ?)", "custom-1", "CUSTOM");

        Integer customCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM daily_challenges WHERE type = 'CUSTOM'",
                Integer.class);

        assertThat(customCount).isEqualTo(1);
    }
}
