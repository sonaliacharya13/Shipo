package com.shipo.backend.model;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "releases")
public class Release {

    public static final int TOTAL_STEPS = 8;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private LocalDate date;

    @Column(columnDefinition = "TEXT")
    private String additionalInfo;

    @Column(nullable = false)
    private String userId;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "release_completed_steps", joinColumns = @JoinColumn(name = "release_id"))
    @Column(name = "step_number")
    private List<Integer> completedSteps = new ArrayList<>();

    // Business Logic: automatic status calculation
    public ReleaseStatus getStatus() {
        if (completedSteps == null || completedSteps.isEmpty()) {
            return ReleaseStatus.PLANNED;
        }
        if (completedSteps.size() >= TOTAL_STEPS) {
            return ReleaseStatus.DONE;
        }
        return ReleaseStatus.ONGOING;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public LocalDate getDate() {
        return date;
    }

    public void setDate(LocalDate date) {
        this.date = date;
    }

    public String getAdditionalInfo() {
        return additionalInfo;
    }

    public void setAdditionalInfo(String additionalInfo) {
        this.additionalInfo = additionalInfo;
    }

    public List<Integer> getCompletedSteps() {
        return completedSteps;
    }

    public void setCompletedSteps(List<Integer> completedSteps) {
        this.completedSteps = completedSteps;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }
}