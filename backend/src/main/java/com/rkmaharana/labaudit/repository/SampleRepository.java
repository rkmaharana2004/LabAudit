package com.rkmaharana.labaudit.repository;

import com.rkmaharana.labaudit.dto.SampleStatusCountDto;
import com.rkmaharana.labaudit.model.Sample;
import com.rkmaharana.labaudit.model.SampleStatus;
import org.springframework.data.mongodb.repository.Aggregation;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SampleRepository extends MongoRepository<Sample, String> {

    Optional<Sample> findBySampleCode(String sampleCode);

    boolean existsBySampleCode(String sampleCode);

    List<SampleStatus> findByStatus(SampleStatus status);

    @Aggregation(pipeline = {
            "{ '$group': { '_id': '$status', 'count': { '$sum': 1 } } }",
            "{ '$project': { 'status': '$_id', 'count': 1, '_id': 0 } }"
    })
    List<SampleStatusCountDto> countSamplesByStatus();
}
