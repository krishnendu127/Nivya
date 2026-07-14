package app.nivya.auth.dto;

public record AuthResponse(
        String accessToken,
        String refreshToken,
        long expiresInSec
) {}
