package com.shipo.backend.controller;

import com.shipo.backend.model.Release;
import com.shipo.backend.repository.ReleaseRepository;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.CrossOrigin;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Controller
@CrossOrigin(origins = "*")
public class ReleaseController {

    private final ReleaseRepository repository;

    public ReleaseController(ReleaseRepository repository) {
        this.repository = repository;
    }

    @QueryMapping
    public List<Release> releases() {
        return repository.findAll();
    }

    @QueryMapping
    public Release release(@Argument Long id) {
        return repository.findById(id).orElse(null);
    }

    @MutationMapping
    public Release createRelease(@Argument Map<String, Object> input) {
        Release release = new Release();
        release.setName((String) input.get("name"));
        release.setDate(LocalDate.parse((String) input.get("date")));
        if (input.containsKey("additionalInfo") && input.get("additionalInfo") != null) {
            release.setAdditionalInfo((String) input.get("additionalInfo"));
        }
        return repository.save(release);
    }

    @MutationMapping
    public Release updateChecklist(@Argument Long id, @Argument List<Integer> completedSteps) {
        Release release = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Release not found with id: " + id));
        release.setCompletedSteps(completedSteps);
        return repository.save(release);
    }

    @MutationMapping
    public Release updateAdditionalInfo(@Argument Long id, @Argument String additionalInfo) {
        Release release = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Release not found with id: " + id));
        release.setAdditionalInfo(additionalInfo);
        return repository.save(release);
    }

    @MutationMapping
    public boolean deleteRelease(@Argument Long id) {
        if (!repository.existsById(id)) {
            return false;
        }
        repository.deleteById(id);
        return true;
    }
}