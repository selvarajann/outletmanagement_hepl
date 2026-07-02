package com.example.outletmanagement.interceptor;

import java.util.concurrent.TimeUnit;

import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.servlet.HandlerInterceptor;

import com.example.outletmanagement.annotation.Idempotent;
import com.example.outletmanagement.exception.IdempotencyException;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class IdempotencyInterceptor implements HandlerInterceptor {

    private final StringRedisTemplate redisTemplate;
    private static final String IDEMPOTENCY_HEADER = "Idempotency-Key";
    private static final String REDIS_PREFIX = "idempotency:";

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        if (handler instanceof HandlerMethod handlerMethod) {
            Idempotent idempotent = handlerMethod.getMethodAnnotation(Idempotent.class);
            if (idempotent != null) {
                String idempotencyKey = request.getHeader(IDEMPOTENCY_HEADER);
                if (idempotencyKey == null || idempotencyKey.isBlank()) {
                    throw new IdempotencyException("Idempotency-Key header is required for this endpoint");
                }

                String redisKey = REDIS_PREFIX + idempotencyKey;
                
                try {
                    // setIfAbsent returns true if the key was set (i.e. it didn't exist before)
                    Boolean isNewKey = redisTemplate.opsForValue().setIfAbsent(redisKey, "processing", idempotent.ttlSeconds(), TimeUnit.SECONDS);

                    if (Boolean.FALSE.equals(isNewKey)) {
                        throw new IdempotencyException("Duplicate request detected. This request has already been processed.");
                    }
                } catch (org.springframework.data.redis.RedisConnectionFailureException e) {
                    // Graceful degradation: If Redis is completely down, log warning and allow request
                    System.err.println("WARNING: Unable to connect to Redis. Skipping idempotency check for key: " + idempotencyKey);
                } catch (IdempotencyException e) {
                    throw e; // Rethrow idempotency conflict
                } catch (Exception e) {
                    System.err.println("WARNING: Redis error during idempotency check: " + e.getMessage());
                }
            }
        }
        return true;
    }
}
