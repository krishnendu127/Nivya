package app.nivya.auth.service;

import app.nivya.auth.BaseIntegrationTest;
import app.nivya.auth.domain.KycStatus;
import app.nivya.auth.domain.RefreshToken;
import app.nivya.auth.domain.UserProfile;
import app.nivya.auth.repository.RefreshTokenRepository;
import app.nivya.auth.repository.UserProfileRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.server.ResponseStatusException;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class RefreshTokenServiceTest extends BaseIntegrationTest {

    @Autowired
    private RefreshTokenService refreshTokenService;

    @Autowired
    private RefreshTokenRepository refreshTokenRepository;

    @Autowired
    private UserProfileRepository userProfileRepository;

    @Value("${nivya.refresh-token.inactivity-expiry-days}")
    private long inactivityExpiryDays;

    @Value("${nivya.refresh-token.absolute-expiry-days}")
    private long absoluteExpiryDays;

    private UserProfile testUser;

    @BeforeEach
    void setUp() {
        refreshTokenRepository.deleteAll();
        userProfileRepository.deleteAll();

        testUser = new UserProfile();
        testUser.setPhone("9876543210");
        testUser.setKycStatus(KycStatus.pending);
        testUser = userProfileRepository.save(testUser);
    }

    @Test
    void createRefreshToken_shouldPersistTokenForUser() {
        RefreshToken refreshToken = refreshTokenService.createRefreshToken(testUser.getId());

        assertThat(refreshToken.getToken()).isNotBlank();
        assertThat(refreshToken.getUser().getId()).isEqualTo(testUser.getId());
        assertThat(refreshToken.getExpiresAt()).isAfter(Instant.now());
    }

    @Test
    void validateRefreshToken_shouldReturnUserIdForValidToken() {
        RefreshToken refreshToken = refreshTokenService.createRefreshToken(testUser.getId());

        UUID userId = refreshTokenService.validateRefreshToken(refreshToken.getToken());

        assertThat(userId).isEqualTo(testUser.getId());
    }

    @Test
    void validateRefreshToken_shouldUpdateLastUsedAt() throws InterruptedException {
        RefreshToken refreshToken = refreshTokenService.createRefreshToken(testUser.getId());
        Instant lastUsedAtBefore = refreshToken.getLastUsedAt();

        Thread.sleep(100);
        refreshTokenService.validateRefreshToken(refreshToken.getToken());

        RefreshToken updated = refreshTokenRepository.findByToken(refreshToken.getToken()).orElseThrow();
        assertThat(updated.getLastUsedAt()).isAfter(lastUsedAtBefore);
    }

    @Test
    void validateRefreshToken_shouldThrowForInvalidToken() {
        assertThatThrownBy(() -> refreshTokenService.validateRefreshToken("invalid-token"))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Invalid refresh token");
    }

    @Test
    void validateRefreshToken_shouldThrowForExpiredToken() {
        // Create token with real clock, then validate with a clock 91 days in the future
        RefreshToken refreshToken = refreshTokenService.createRefreshToken(testUser.getId());

        Clock futureClock = Clock.fixed(Instant.now().plus(91, ChronoUnit.DAYS), ZoneOffset.UTC);
        RefreshTokenService futureService = new RefreshTokenService(
                refreshTokenRepository, userProfileRepository,
                inactivityExpiryDays, absoluteExpiryDays, futureClock
        );

        assertThatThrownBy(() -> futureService.validateRefreshToken(refreshToken.getToken()))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Refresh token expired");
    }

    @Test
    void validateRefreshToken_shouldThrowForInactiveToken() {
        // Create token with real clock, then validate with a clock 8 days in the future
        RefreshToken refreshToken = refreshTokenService.createRefreshToken(testUser.getId());

        Clock futureClock = Clock.fixed(Instant.now().plus(8, ChronoUnit.DAYS), ZoneOffset.UTC);
        RefreshTokenService futureService = new RefreshTokenService(
                refreshTokenRepository, userProfileRepository,
                inactivityExpiryDays, absoluteExpiryDays, futureClock
        );

        assertThatThrownBy(() -> futureService.validateRefreshToken(refreshToken.getToken()))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Session expired due to inactivity");
    }

    @Test
    void revokeAllRefreshTokens_shouldDeleteAllTokensForUser() {
        refreshTokenService.createRefreshToken(testUser.getId());
        refreshTokenService.createRefreshToken(testUser.getId());

        refreshTokenService.revokeAllRefreshTokens(testUser.getId());

        assertThat(refreshTokenRepository.findAll()).isEmpty();
    }

    @Test
    void revokeAllRefreshTokens_shouldNotAffectOtherUsers() {
        UserProfile otherUser = new UserProfile();
        otherUser.setPhone("9999999999");
        otherUser.setKycStatus(KycStatus.pending);
        otherUser = userProfileRepository.save(otherUser);

        refreshTokenService.createRefreshToken(testUser.getId());
        refreshTokenService.createRefreshToken(otherUser.getId());

        refreshTokenService.revokeAllRefreshTokens(testUser.getId());

        assertThat(refreshTokenRepository.findAll()).hasSize(1);
        assertThat(refreshTokenRepository.findAll().get(0).getUser().getId()).isEqualTo(otherUser.getId());
    }
}
