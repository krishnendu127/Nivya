package app.nivya.auth.service;

import app.nivya.auth.dto.AuthResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

@Service
public class AuthService {

    private final OtpService otpService;
    private final UserService userService;
    private final JwtService jwtService;
    private final RefreshTokenService refreshTokenService;
    private final long accessTokenExpirySeconds;

    public AuthService(
            OtpService otpService,
            UserService userService,
            JwtService jwtService,
            RefreshTokenService refreshTokenService,
            @Value("${nivya.jwt.access-token-expiry-seconds}") long accessTokenExpirySeconds
    ) {
        this.otpService = otpService;
        this.userService = userService;
        this.jwtService = jwtService;
        this.refreshTokenService = refreshTokenService;
        this.accessTokenExpirySeconds = accessTokenExpirySeconds;
    }

    public void sendOtp(String phoneNumber) {
        otpService.sendOtp(phoneNumber);
    }

    public AuthResponse verifyOtp(String phoneNumber, String otp) {
        if (!otpService.verifyOtp(phoneNumber, otp)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid or expired OTP");
        }

        UUID userId = userService.notifyUserLogin(phoneNumber);
        String accessToken = jwtService.issueAccessToken(userId);
        String refreshToken = refreshTokenService.createRefreshToken(userId).getToken();

        return new AuthResponse(accessToken, refreshToken, accessTokenExpirySeconds);
    }

    public AuthResponse refreshAccessToken(String refreshToken) {
        UUID userId = refreshTokenService.validateRefreshToken(refreshToken);
        String newAccessToken = jwtService.issueAccessToken(userId);
        return new AuthResponse(newAccessToken, refreshToken, accessTokenExpirySeconds);
    }

    public void logout(UUID userId) {
        refreshTokenService.revokeAllRefreshTokens(userId);
    }
}
