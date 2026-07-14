package app.nivya.auth.service;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import io.jsonwebtoken.security.SignatureException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.assertj.core.api.Assertions.within;

class JwtServiceTest {

    private static final String SECRET = "test-secret-key-minimum-32-chars-long!!";
    private static final long EXPIRY_SECONDS = 3600;

    private JwtService jwtService;
    private SecretKey signingKey;

    @BeforeEach
    void setUp() {
        jwtService = new JwtService(SECRET, EXPIRY_SECONDS);
        signingKey = Keys.hmacShaKeyFor(SECRET.getBytes(StandardCharsets.UTF_8));
    }

    @Test
    void issueAccessToken_shouldReturnValidJwt() {
        UUID userId = UUID.randomUUID();

        String token = jwtService.issueAccessToken(userId);

        assertThat(token).isNotBlank();
    }

    @Test
    void issueAccessToken_shouldContainCorrectUserId() {
        UUID userId = UUID.randomUUID();

        String token = jwtService.issueAccessToken(userId);

        Claims claims = Jwts.parser()
                .verifyWith(signingKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();

        assertThat(claims.getSubject()).isEqualTo(userId.toString());
    }

    @Test
    void issueAccessToken_shouldSetCorrectExpiry() {
        UUID userId = UUID.randomUUID();

        String token = jwtService.issueAccessToken(userId);

        Claims claims = Jwts.parser()
                .verifyWith(signingKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();

        assertThat(claims.getExpiration().toInstant())
                .isCloseTo(Instant.now().plusSeconds(EXPIRY_SECONDS), within(1, ChronoUnit.SECONDS));
    }

    @Test
    void issueAccessToken_shouldSetIssuedAt() {
        UUID userId = UUID.randomUUID();

        String token = jwtService.issueAccessToken(userId);

        Claims claims = Jwts.parser()
                .verifyWith(signingKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();

        assertThat(claims.getIssuedAt().toInstant())
                .isCloseTo(Instant.now(), within(1, ChronoUnit.SECONDS));
    }

    @Test
    void issueAccessToken_shouldBeRejectedWithDifferentSecret() {
        UUID userId = UUID.randomUUID();
        String token = jwtService.issueAccessToken(userId);

        SecretKey differentKey = Keys.hmacShaKeyFor(
                "different-secret-key-minimum-32-chars!!".getBytes(StandardCharsets.UTF_8)
        );

        assertThatThrownBy(() ->
                Jwts.parser()
                        .verifyWith(differentKey)
                        .build()
                        .parseSignedClaims(token)
        ).isInstanceOf(SignatureException.class);
    }

    @Test
    void issueAccessToken_shouldThrowWhenTokenExpired() {
        JwtService shortLivedJwtService = new JwtService(SECRET, -1);
        UUID userId = UUID.randomUUID();
        String expiredToken = shortLivedJwtService.issueAccessToken(userId);

        assertThatThrownBy(() ->
                Jwts.parser()
                        .verifyWith(signingKey)
                        .build()
                        .parseSignedClaims(expiredToken)
        ).isInstanceOf(ExpiredJwtException.class);
    }
}
