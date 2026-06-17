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
import org.springframework.data.domain.PageImpl;
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
import com.example.outletmanagement.service.EmailService;
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
    private final EmailService emailService;

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

        // Reload with full details to avoid lazy-load in mapToResponse
        List<OutletDivisionProduct> mappings = mappingRepo.findByOutletIdWithDetails(saved.getId());
        OutletResponse response = mapToResponse(saved, mappings);

        // ── Mailtrap Email ──────────────────────────────────────────────────
        emailService.sendOutletCreatedEmail(
                "admin@outletmanagement.com",
                saved.getOutletName(), saved.getOutletCode(),
                saved.getOwnerName() != null ? saved.getOwnerName() : "N/A",
                location.getName());

        return response;
    }

    @Override
    public OutletResponse getOutletById(Long id) {
        // FIX: use fetch-join to load outlet+location in one query
        Outlet outlet = outletRepository.findByIdWithLocation(id)
                .orElseThrow(() -> new RuntimeException("Outlet not found"));
        // FIX: load all mappings with division+product in one query
        List<OutletDivisionProduct> mappings = mappingRepo.findByOutletIdWithDetails(id);
        return mapToResponse(outlet, mappings);
    }

    @Override
    public Page<OutletResponse> getAllOutlets(String keyword, Long locationId, Long divisionId, String outletType, Pageable pageable) {
        // FIX: page query returns outlet IDs; then batch-fetch mappings for all outlets in one query
        Page<Outlet> page = outletRepository.findAll(
                OutletSpecification.searchAndFilter(keyword, locationId, divisionId, outletType), pageable);

        if (page.isEmpty()) {
            return page.map(o -> mapToResponse(o, List.of()));
        }

        Set<Long> outletIds = page.getContent().stream().map(Outlet::getId).collect(Collectors.toSet());
        // Single query fetches all mappings for all outlets on this page
        List<OutletDivisionProduct> allMappings = mappingRepo.findByOutletIdsWithDetails(outletIds);

        Map<Long, List<OutletDivisionProduct>> mappingsByOutlet = allMappings.stream()
                .collect(Collectors.groupingBy(m -> m.getOutlet().getId()));

        List<OutletResponse> responses = page.getContent().stream()
                .map(o -> mapToResponse(o, mappingsByOutlet.getOrDefault(o.getId(), List.of())))
                .collect(Collectors.toList());

        return new PageImpl<>(responses, pageable, page.getTotalElements());
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

        List<OutletDivisionProduct> mappings = mappingRepo.findByOutletIdWithDetails(updated.getId());
        OutletResponse response = mapToResponse(updated, mappings);

        // ── Mailtrap Email ──────────────────────────────────────────────────
        emailService.sendOutletUpdatedEmail(
                "admin@outletmanagement.com",
                updated.getOutletName(), updated.getOutletCode());

        return response;
    }

    @Transactional
    @Override
    public void deleteOutlet(Long id) {
        Outlet outlet = outletRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Outlet not found"));
        mappingRepo.deleteByOutlet_Id(id);
        outletRepository.deleteById(id);

        // ── Mailtrap Email ──────────────────────────────────────────────────
        emailService.sendOutletDeletedEmail(
                "admin@outletmanagement.com",
                outlet.getOutletName(), outlet.getOutletCode());
    }

    private void saveMappings(Outlet outlet, List<OutletDivisionProductRequest> mappings) {
        Set<String> uniqueCheck = new HashSet<>();

        Set<Long> divisionIds = mappings.stream()
                .map(OutletDivisionProductRequest::getDivisionId)
                .collect(Collectors.toSet());

        Set<Long> productIds = mappings.stream()
                .map(OutletDivisionProductRequest::getProductId)
                .collect(Collectors.toSet());

        // FIX: batch-load all divisions and products in two queries instead of N queries
        Map<Long, Division> divisionMap = divisionRepository.findAllById(divisionIds)
                .stream().collect(Collectors.toMap(Division::getId, d -> d));

        Map<Long, Products> productMap = productRepository.findAllById(productIds)
                .stream().collect(Collectors.toMap(Products::getId, p -> p));

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

    /**
     * FIX: mappings are now passed in (pre-fetched with JOIN FETCH division+product+product.division).
     * No repository calls inside this method — eliminates N+1 entirely.
     */
    private OutletResponse mapToResponse(Outlet outlet, List<OutletDivisionProduct> mappings) {
        String locationName = outlet.getLocation() != null ? outlet.getLocation().getName() : null;
        Long locationId = outlet.getLocation() != null ? outlet.getLocation().getId() : null;

        // Group by division — division and product are already loaded via JOIN FETCH
        Map<Long, List<Products>> grouped = new HashMap<>();
        Map<Long, Division> divisionMap = new HashMap<>();

        for (OutletDivisionProduct m : mappings) {
            Division div = m.getDivision();
            divisionMap.put(div.getId(), div);
            grouped.computeIfAbsent(div.getId(), k -> new ArrayList<>()).add(m.getProduct());
        }

        List<DivisionResponse> divisions = new ArrayList<>();
        for (Long divId : grouped.keySet()) {
            Division division = divisionMap.get(divId);

            List<ProductResponse> products = grouped.get(divId).stream()
                    .map(p -> new ProductResponse(
                            p.getId(), p.getName(), p.getProductCode(),
                            p.getDivision() != null ? p.getDivision().getId() : null,
                            p.getUimPrice(), p.getMrp(), p.getSellingPrice(),
                            p.getPurchasePrice(), p.getImageUrl()))
                    .toList();

            divisions.add(new DivisionResponse(division.getId(), division.getName(), products));
        }

        return new OutletResponse(
                outlet.getId(),
                outlet.getOutletName(),
                outlet.getOutletCode(),
                locationId,
                locationName,
                divisions,
                outlet.getOutletType(),
                outlet.getOwnerName(),
                outlet.getAddress()
        );
    }
}
