package com.example.outletmanagement.service.impl;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.outletmanagement.model.entity.Division;
import com.example.outletmanagement.model.entity.Location;
import com.example.outletmanagement.model.entity.Outlet;
import com.example.outletmanagement.model.entity.OutletDivisionProduct;
import com.example.outletmanagement.model.entity.Products;
import com.example.outletmanagement.payload.dto.DivisionDto.DivisionResponse;
import com.example.outletmanagement.payload.dto.OutletDivisionProductDto.OutletDivisionProductRequest;
import com.example.outletmanagement.payload.dto.OutletDto.OutletRequest;
import com.example.outletmanagement.payload.dto.OutletDto.OutletResponse;
import com.example.outletmanagement.payload.dto.ProductDto.ProductResponse;
import com.example.outletmanagement.repository.DivisionRepository;
import com.example.outletmanagement.repository.LocationRepository;
import com.example.outletmanagement.repository.OutletDivisionProductRepository;
import com.example.outletmanagement.repository.OutletRepository;
import com.example.outletmanagement.repository.ProductRepository;
import com.example.outletmanagement.service.OutletService;
import com.example.outletmanagement.specification.OutletSpecification;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class OutletServiceImpl implements OutletService {

    private final OutletRepository outletRepository;
    private final LocationRepository locationRepository;
    private final DivisionRepository divisionRepository;
    private final ProductRepository productRepository;
    private final OutletDivisionProductRepository mappingRepo;

    @Transactional
    @Override
    public OutletResponse createOutlet(OutletRequest request) {

        Location location = locationRepository.findById(request.getLocationId())
                .orElseThrow(() -> new RuntimeException("Location not found"));

        Outlet outlet = new Outlet();
        outlet.setOutletCode("O" + System.currentTimeMillis());
        outlet.setOutletName(request.getOutletName());
        outlet.setAddress(request.getAddress());
        outlet.setLocation(location);
        outlet.setOutletType(request.getOutletType());
        outlet.setOwnerName(request.getOwnerName());
        outlet.setCreatedAt(LocalDateTime.now());
        outlet.setUpdatedAt(LocalDateTime.now());

        Outlet saved = outletRepository.save(outlet);

        saveMappings(saved, request.getMappings());

        return mapToResponse(saved);
    }

    @Override
    public OutletResponse getOutletById(Long id) {
        Outlet outlet = outletRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Outlet not found"));
        return mapToResponse(outlet);
    }

    @Override
    public Page<OutletResponse> getAllOutlets(String keyword, Long locationId, Long divisionId, Pageable pageable) {
        return outletRepository.findAll(OutletSpecification.searchAndFilter(keyword, locationId, divisionId), pageable)
                .map(this::mapToResponse);
    }

    @Transactional
    @Override
    public OutletResponse updateOutlet(Long id, OutletRequest request) {

        Outlet outlet = outletRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Outlet not found"));

        Location location = locationRepository.findById(request.getLocationId())
                .orElseThrow(() -> new RuntimeException("Location not found"));

        outlet.setOutletName(request.getOutletName());
        outlet.setAddress(request.getAddress());
        outlet.setLocation(location);
        outlet.setOutletType(request.getOutletType());
        outlet.setOwnerName(request.getOwnerName());
        outlet.setUpdatedAt(LocalDateTime.now());

        Outlet updated = outletRepository.save(outlet);

        mappingRepo.deleteByOutlet_Id(updated.getId());
        mappingRepo.flush();

        saveMappings(updated, request.getMappings());

        return mapToResponse(updated);
    }

    @Transactional
    @Override
    public void deleteOutlet(Long id) {

        if (!outletRepository.existsById(id)) {
            throw new RuntimeException("Outlet not found");
        }

        mappingRepo.deleteByOutlet_Id(id);
        outletRepository.deleteById(id);
    }

    private void saveMappings(Outlet outlet, List<OutletDivisionProductRequest> mappings) {

        Set<String> uniqueCheck = new HashSet<>();

        Set<Long> divisionIds = mappings.stream()
                .map(OutletDivisionProductRequest::getDivisionId)
                .collect(Collectors.toSet());

        Set<Long> productIds = mappings.stream()
                .map(OutletDivisionProductRequest::getProductId)
                .collect(Collectors.toSet());

        Map<Long, Division> divisionMap = divisionRepository.findAllById(divisionIds)
                .stream()
                .collect(Collectors.toMap(Division::getId, d -> d));

        Map<Long, Products> productMap = productRepository.findAllById(productIds)
                .stream()
                .collect(Collectors.toMap(Products::getId, p -> p));

        List<OutletDivisionProduct> toSave = new ArrayList<>();

        for (OutletDivisionProductRequest req : mappings) {

            String key = req.getDivisionId() + "-" + req.getProductId();

            if (!uniqueCheck.add(key)) {
                throw new RuntimeException("Duplicate mapping in request");
            }

            Division division = divisionMap.get(req.getDivisionId());
            if (division == null) throw new RuntimeException("Division not found");

            Products product = productMap.get(req.getProductId());
            if (product == null) throw new RuntimeException("Product not found");

            OutletDivisionProduct map = new OutletDivisionProduct();
            map.setOutlet(outlet);
            map.setDivision(division);
            map.setProduct(product);

            toSave.add(map);
        }

        mappingRepo.saveAll(toSave);
    }

    private OutletResponse mapToResponse(Outlet outlet) {

        String locationName = outlet.getLocation() != null
                ? outlet.getLocation().getName()
                : null;

        List<OutletDivisionProduct> mappings =
                mappingRepo.findByOutlet_Id(outlet.getId());

        Map<Long, List<Products>> grouped = new HashMap<>();

        for (OutletDivisionProduct m : mappings) {
            grouped
                .computeIfAbsent(m.getDivision().getId(), k -> new ArrayList<>())
                .add(m.getProduct());
        }
        Map<Long, Division> divisionMap = divisionRepository
                .findAllById(grouped.keySet())
                .stream()
                .collect(Collectors.toMap(Division::getId, d -> d));

        List<DivisionResponse> divisions = new ArrayList<>();

        for (Long divisionId : grouped.keySet()) {

            Division division = divisionMap.get(divisionId);
            if (division == null) throw new RuntimeException("Division not found");

            List<ProductResponse> products = grouped.get(divisionId)
                    .stream()
                    .map(p -> new ProductResponse(
                            p.getId(), p.getName(), p.getProductCode(),
                            p.getUimPrice(), p.getMrp(), p.getSellingPrice(),
                            p.getPurchasePrice())).toList();
                //              p.getExpireDate()))
                //     .toList();

            divisions.add(new DivisionResponse(
                    division.getId(),
                    division.getName(),
                    products
            ));
        }

        return new OutletResponse(
                outlet.getId(),
                outlet.getOutletName(),
                outlet.getOutletCode(),
                locationName,
                divisions,
                outlet.getOutletType(),
                outlet.getOwnerName(),
                outlet.getAddress()
        );
    }
}