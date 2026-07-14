package app.nivya.auth.service;

import app.nivya.auth.domain.RefreshToken;
import app.nivya.auth.domain.UserProfile;
import app.nivya.auth.repository.RefreshTokenRepository;
import app.nivya.auth.repository.UserProfileRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.UUID;

@Service
public class RefreshTokenService {

    private final RefreshTokenRepository refreshTokenRepository;
    private final UserProfileRepository userProfileRepository;
    private final long inactivityExpiryDays;
    private final long absoluteExpiryDays;

    public RefreshTokenService(
            RefreshTokenRepository refreshTokenRepository,
            UserProfileRepository userProfileRepository,
            @Value("${nivya.refresh-token.inactivity-expiry-days}") long inactivityExpiryDays,
            @Value("${nivya.refresh-token.absolute-expiry-days}") long absoluteExpiryDays
    ) {
        this.refreshTokenRepository = refreshTokenRepository;
        this.userProfileRepository = userProfileRepository;
        this.inactivityExpiryDays = inactivityExpiryDays;
        this.absoluteExpiryDays = absoluteExpiryDays;
    }

    @Transactional
    public RefreshToken createRefreshToken(UUID userId) {
        UserProfile userProfile = userProfileRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        RefreshToken refreshToken = new RefreshToken();
        refreshToken.setUser(userProfile);
        refreshToken.setToken(UUID.randomUUID().toString());
        refreshToken.setLastUsedAt(Instant.now());
        refreshToken.setExpiresAt(Instant.now().plusSeconds(absoluteExpiryDays * 24 * 3600));

        return refreshTokenRepository.save(refreshToken);
    }

    @Transactional
    public UUID validateRefreshToken(String token) {
        RefreshToken refreshToken = refreshTokenRepository.findByToken(token)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid refresh token"));

        Instant now = Instant.now();

        if (now.isAfter(refreshToken.getExpiresAt())) {
            refreshTokenRepository.delete(refreshToken);
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Refresh token expired");
        }

        Instant inactivityDeadline = refreshToken.getLastUsedAt().plusSeconds(inactivityExpiryDays * 24 * 3600);
        if (now.isAfter(inactivityDeadline)) {
            refreshTokenRepository.delete(refreshToken);
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Session expired due to inactivity");
        }

        refreshToken.setLastUsedAt(now);
        refreshTokenRepository.save(refreshToken);

        return refreshToken.getUser().getId();
    }

    @Transactional
    public void revokeAllRefreshTokens(UUID userId) {
        refreshTokenRepository.deleteAllByUserId(userId);
    }
}
