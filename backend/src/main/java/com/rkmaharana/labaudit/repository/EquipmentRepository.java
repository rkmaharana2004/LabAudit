package com.rkmaharana.labaudit.repository;

import com.rkmaharana.labaudit.model.Equipment;
import com.rkmaharana.labaudit.model.EquipmentStatus;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EquipmentRepository extends MongoRepository<Equipment, String> {
    Optional<Equipment> findByAssetTag(String assetTag);
    boolean existsByAssetTag(String assetTag);
    List<Equipment> findByStatus(EquipmentStatus status);
}
