package com.example.outletmanagement.service.impl;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import com.example.outletmanagement.model.entity.Division;
import com.example.outletmanagement.payload.dto.DivisionDto.DivisionRequest;
import com.example.outletmanagement.payload.dto.DivisionDto.DivisionResponse;
import com.example.outletmanagement.payload.dto.ProductDto.ProductResponse;
import com.example.outletmanagement.repository.DivisionRepository;
import com.example.outletmanagement.repository.ProductRepository;
import com.example.outletmanagement.service.DivisionService;
import com.example.outletmanagement.specification.DivisionSpecification;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class DivisionServiceImpl implements DivisionService {

    private final DivisionRepository divisionRepository;
    private final ProductRepository productRepository;

    @Override
    public DivisionResponse createDivision(DivisionRequest request) {

        String name = request.getName().trim();

        if (divisionRepository.existsByNameIgnoreCase(name)) {
            throw new RuntimeException("Division already exists!");
        }

        Division division = new Division();
        division.setName(name);

        return mapToResponse(divisionRepository.save(division));
    }

    @Override
    public Page<DivisionResponse> getAllDivisions(String keyword, Boolean hasProducts, Pageable pageable) {
        return divisionRepository.findAll(DivisionSpecification.searchAndFilter(keyword, hasProducts), pageable)
                .map(this::mapToResponse);
    }

    @Override
    public DivisionResponse getDivisionById(Long id) {

        Division division = divisionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Division not found"));

        return mapToResponse(division);
    }
    @Override
    public DivisionResponse updateDivision(Long id, DivisionRequest request) {

        Division division = divisionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Division not found"));

        String newName = request.getName().trim();

        if (!division.getName().equalsIgnoreCase(newName)
                && divisionRepository.existsByNameIgnoreCase(newName)) {
            throw new RuntimeException("Division already exists!");
        }

        division.setName(newName);

        return mapToResponse(divisionRepository.save(division));
    }

    @Override
    public void deleteDivision(Long id) {

        Division division = divisionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Division not found"));

        // ❗ If using mapping table still → keep this
        // ❗ If removed mapping → remove this block
        // if (mappingRepo.existsByDivision_Id(id)) {
        //     throw new RuntimeException("Division is used in mapping, cannot delete");
        // }

        divisionRepository.delete(division);
    }


    private DivisionResponse mapToResponse(Division division) {

        List<ProductResponse> products = productRepository
                .findByDivision_Id(division.getId())
                .stream()
                .map(p -> new ProductResponse(
                        p.getId(), p.getName(), p.getProductCode(),
                        p.getUimPrice(), p.getMrp(), p.getSellingPrice(),
                        p.getPurchasePrice())).toList();
                        //         p.getExpireDate()))
                        // .toList();

        return new DivisionResponse(
                division.getId(),
                division.getName(),
                products
        );
    }
}