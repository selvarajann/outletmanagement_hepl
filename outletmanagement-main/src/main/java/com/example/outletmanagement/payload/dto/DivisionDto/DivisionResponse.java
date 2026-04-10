package com.example.outletmanagement.payload.dto.DivisionDto;
import com.example.outletmanagement.payload.dto.ProductDto.ProductResponse;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;
@Data
@NoArgsConstructor
@AllArgsConstructor
public class DivisionResponse {
    
   private Long id;
private String name;
private List<ProductResponse> products;
}
