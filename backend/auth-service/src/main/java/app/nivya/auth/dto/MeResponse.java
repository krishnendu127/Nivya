package app.nivya.auth.dto;

import app.nivya.auth.domain.KycStatus;

import java.time.LocalDate;
import java.util.UUID;

public record MeResponse(
        UUID id,
        String phone,
        String email,
        KycStatus kycStatus,
        String name,
        LocalDate dob
) {}
