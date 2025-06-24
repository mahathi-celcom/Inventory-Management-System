package com.inventory.system.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import java.util.List;

@Data
public class PageResponse<T> {
    @JsonProperty("content")
    private List<T> content;
    
    @JsonProperty("pageNumber")
    private int pageNumber;
    
    @JsonProperty("pageSize")
    private int pageSize;
    
    @JsonProperty("totalElements")
    private long totalElements;
    
    @JsonProperty("totalPages")
    private int totalPages;
    
    @JsonProperty("last")
    private boolean last;
    
    @JsonProperty("first")
    private boolean first;

    public PageResponse(List<T> content, int pageNumber, int pageSize, long totalElements, int totalPages, boolean last, boolean first) {
        this.content = content;
        this.pageNumber = pageNumber;
        this.pageSize = pageSize;
        this.totalElements = totalElements;
        this.totalPages = totalPages;
        this.last = last;
        this.first = first;
    }
} 