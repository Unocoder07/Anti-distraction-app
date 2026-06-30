package com.sankalai.config;

import java.sql.Connection;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;

import javax.sql.DataSource;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import com.sankalai.entity.DailyChallenge;

@Component
public class H2SchemaMigration implements ApplicationRunner {

    private static final Logger logger = LoggerFactory.getLogger(H2SchemaMigration.class);
    private static final String DAILY_CHALLENGES_TABLE = "DAILY_CHALLENGES";
    private static final String DAILY_CHALLENGES_TYPE_CHECK = "CHK_DAILY_CHALLENGES_TYPE";

    private final DataSource dataSource;
    private final JdbcTemplate jdbcTemplate;

    public H2SchemaMigration(DataSource dataSource, JdbcTemplate jdbcTemplate) {
        this.dataSource = dataSource;
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(ApplicationArguments args) throws Exception {
        if (!isH2Database() || !tableExists(DAILY_CHALLENGES_TABLE)) {
            return;
        }

        repairDailyChallengeTypeConstraint();
    }

    private boolean isH2Database() throws Exception {
        try (Connection connection = dataSource.getConnection()) {
            return "H2".equalsIgnoreCase(connection.getMetaData().getDatabaseProductName());
        }
    }

    private boolean tableExists(String tableName) {
        Integer count = jdbcTemplate.queryForObject("""
                SELECT COUNT(*)
                FROM INFORMATION_SCHEMA.TABLES
                WHERE TABLE_NAME = ?
                """, Integer.class, tableName);
        return count != null && count > 0;
    }

    private void repairDailyChallengeTypeConstraint() {
        List<String> allowedTypes = Arrays.stream(DailyChallenge.ChallengeType.values())
                .map(Enum::name)
                .collect(Collectors.toList());

        List<CheckConstraint> typeConstraints = findDailyChallengeCheckConstraints().stream()
                .filter(constraint -> referencesColumn(constraint.checkClause(), "TYPE"))
                .filter(constraint -> containsAnyValue(constraint.checkClause(), allowedTypes))
                .collect(Collectors.toList());

        boolean hasCurrentConstraint = typeConstraints.stream()
                .anyMatch(constraint -> containsAllValues(constraint.checkClause(), allowedTypes));

        List<CheckConstraint> staleConstraints = typeConstraints.stream()
                .filter(constraint -> !containsAllValues(constraint.checkClause(), allowedTypes))
                .collect(Collectors.toList());

        for (CheckConstraint constraint : staleConstraints) {
            jdbcTemplate.execute("ALTER TABLE " + quoteIdentifier(DAILY_CHALLENGES_TABLE)
                    + " DROP CONSTRAINT " + quoteIdentifier(constraint.name()));
            logger.info("Dropped stale H2 daily_challenges type check constraint {}", constraint.name());
        }

        if (!hasCurrentConstraint) {
            jdbcTemplate.execute("ALTER TABLE " + quoteIdentifier(DAILY_CHALLENGES_TABLE)
                    + " ADD CONSTRAINT " + quoteIdentifier(DAILY_CHALLENGES_TYPE_CHECK)
                    + " CHECK (" + quoteIdentifier("TYPE") + " IN (" + quotedValues(allowedTypes) + "))");
            logger.info("Added H2 daily_challenges type check constraint with values {}", allowedTypes);
        }
    }

    private List<CheckConstraint> findDailyChallengeCheckConstraints() {
        return jdbcTemplate.query("""
                SELECT cc.CONSTRAINT_NAME, cc.CHECK_CLAUSE
                FROM INFORMATION_SCHEMA.CHECK_CONSTRAINTS cc
                JOIN INFORMATION_SCHEMA.TABLE_CONSTRAINTS tc
                  ON tc.CONSTRAINT_SCHEMA = cc.CONSTRAINT_SCHEMA
                 AND tc.CONSTRAINT_NAME = cc.CONSTRAINT_NAME
                WHERE tc.TABLE_NAME = ?
                  AND tc.CONSTRAINT_TYPE = 'CHECK'
                """,
                (rs, rowNum) -> new CheckConstraint(
                        rs.getString("CONSTRAINT_NAME"),
                        rs.getString("CHECK_CLAUSE")),
                DAILY_CHALLENGES_TABLE);
    }

    private boolean referencesColumn(String checkClause, String columnName) {
        String normalizedClause = normalizeSql(checkClause);
        String normalizedColumn = columnName.toUpperCase(Locale.ROOT);

        return normalizedClause.contains("\"" + normalizedColumn + "\"")
                || normalizedClause.startsWith(normalizedColumn + " ")
                || normalizedClause.contains(" " + normalizedColumn + " ")
                || normalizedClause.contains("(" + normalizedColumn + " ");
    }

    private boolean containsAnyValue(String checkClause, List<String> values) {
        return values.stream().anyMatch(value -> containsValue(checkClause, value));
    }

    private boolean containsAllValues(String checkClause, List<String> values) {
        return values.stream().allMatch(value -> containsValue(checkClause, value));
    }

    private boolean containsValue(String checkClause, String value) {
        return normalizeSql(checkClause).contains("'" + value.toUpperCase(Locale.ROOT) + "'");
    }

    private String normalizeSql(String sql) {
        return sql == null ? "" : sql.toUpperCase(Locale.ROOT);
    }

    private String quotedValues(List<String> values) {
        return values.stream()
                .map(value -> "'" + value.replace("'", "''") + "'")
                .collect(Collectors.joining(", "));
    }

    private String quoteIdentifier(String identifier) {
        return "\"" + identifier.replace("\"", "\"\"") + "\"";
    }

    private record CheckConstraint(String name, String checkClause) {
    }
}
