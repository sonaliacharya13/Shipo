package com.shipo.backend;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import com.shipo.backend.model.Release;
import com.shipo.backend.model.ReleaseStatus;

class ReleaseStatusTest {

    @Test
    @DisplayName("0 steps completed -> PLANNED")
    void testPlanned() {
        Release r = new Release();
        r.setCompletedSteps(List.of());
        assertEquals(ReleaseStatus.PLANNED, r.getStatus());
    }

    @Test
    @DisplayName("1 to 7 steps completed -> ONGOING")
    void testOngoing() {
        Release r = new Release();
        r.setCompletedSteps(List.of(1, 2, 4));
        assertEquals(ReleaseStatus.ONGOING, r.getStatus());
    }

    @Test
    @DisplayName("All 8 steps completed -> DONE")
    void testDone() {
        Release r = new Release();
        r.setCompletedSteps(List.of(1, 2, 3, 4, 5, 6, 7, 8));
        assertEquals(ReleaseStatus.DONE, r.getStatus());
    }
}