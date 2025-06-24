package com.inventory.system.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.lang.NonNull;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(@NonNull CorsRegistry registry) {
        registry.addMapping("/api/**")
                // Use explicit origins for security with credentials
                .allowedOrigins(
                    "http://localhost:4200",
                    "http://localhost:3000",
                    "http://172.27.112.1:4200"
                )
                // Allow origin patterns for flexibility
                .allowedOriginPatterns(
                    "http://localhost:*",
                    "http://172.27.112.1:*"
                )
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD", "PATCH")
                .allowedHeaders("*")
                .allowCredentials(true)
                .maxAge(3600);
    }
} 