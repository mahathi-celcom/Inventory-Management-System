package com.inventory.system.config;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/cors-test")
@CrossOrigin(origins = {"http://localhost:4200", "http://localhost:3000", "http://172.27.112.1:4200"}, 
             allowedHeaders = "*", 
             allowCredentials = "true",
             methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.OPTIONS})
public class CorsTestController {
    
    @GetMapping("/simple")
    public ResponseEntity<Map<String, String>> simpleGet() {
        Map<String, String> response = new HashMap<>();
        response.put("message", "CORS is working!");
        response.put("timestamp", java.time.LocalDateTime.now().toString());
        return ResponseEntity.ok(response);
    }
    
    @PostMapping("/with-credentials")
    public ResponseEntity<Map<String, String>> postWithCredentials(@RequestBody Map<String, Object> data) {
        Map<String, String> response = new HashMap<>();
        response.put("message", "CORS with credentials is working!");
        response.put("received", data.toString());
        response.put("timestamp", java.time.LocalDateTime.now().toString());
        return ResponseEntity.ok(response);
    }
} 