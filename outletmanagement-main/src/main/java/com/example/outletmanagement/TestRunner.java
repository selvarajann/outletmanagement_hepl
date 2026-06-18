package com.example.outletmanagement;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.jdbc.core.JdbcTemplate;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class TestRunner implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;
    private static final Logger log = LoggerFactory.getLogger(TestRunner.class);

    @Override
    public void run(String... args) throws Exception {
        log.info(">>>> [TEST RUNNER] Querying audit_log...");
        List<Map<String, Object>> rows = jdbcTemplate.queryForList("SELECT id, action, business_key FROM audit_log ORDER BY id DESC LIMIT 5");
        for (Map<String, Object> row : rows) {
            log.info(">>>> [DB RESULT] ID={}, ACTION={}, BUSINESS_KEY={}", row.get("id"), row.get("action"), row.get("business_key"));
        }
    }
}
