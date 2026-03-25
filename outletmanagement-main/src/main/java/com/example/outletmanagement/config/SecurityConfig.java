package com.example.outletmanagement.config;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import com.example.outletmanagement.filter.JwtAuthenticationFilter;
import org.springframework.context.annotation.Bean;
@Configuration

public class SecurityConfig {
@Autowired
private JwtAuthenticationFilter jwtAuthenticationFilter;
@Bean
public FilterRegistrationBean<JwtAuthenticationFilter> jwtFilter() {
    FilterRegistrationBean<JwtAuthenticationFilter> registrationBean = new FilterRegistrationBean<>();
    registrationBean.setFilter(jwtAuthenticationFilter);
    registrationBean.addUrlPatterns("/api/*");
    registrationBean.setOrder(1); 
    return registrationBean;
}
}
