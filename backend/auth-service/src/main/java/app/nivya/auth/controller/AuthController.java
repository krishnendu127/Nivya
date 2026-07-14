package app.nivya.auth.controller;

import app.nivya.auth.dto.*;
import app.nivya.auth.service.AuthService;
import app.nivya.auth.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/v1")
public class AuthController {

    private final AuthService authService;
    private final UserService userService;

    public AuthController(AuthService authService, UserService userService) {
        this.authService = authService;
        this.userService = userService;
    }

    @PostMapping("/auth/otp/send")
    public ResponseEntity<Void> sendOtp(@Valid @RequestBody SendOtpRequest sendOtpRequest) {
        authService.sendOtp(sendOtpRequest.phone());
        return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
    }

    @PostMapping("/auth/otp/verify")
    public ResponseEntity<AuthResponse> verifyOtp(@Valid @RequestBody VerifyOtpRequest verifyOtpRequest) {
        AuthResponse authResponse = authService.verifyOtp(verifyOtpRequest.phone(), verifyOtpRequest.otp());
        return ResponseEntity.ok(authResponse);
    }

    @PostMapping("/auth/token/refresh")
    public ResponseEntity<AuthResponse> refreshToken(@Valid @RequestBody RefreshTokenRequest refreshTokenRequest) {
        AuthResponse authResponse = authService.refreshAccessToken(refreshTokenRequest.refreshToken());
        return ResponseEntity.ok(authResponse);
    }

    @PostMapping("/auth/logout")
    public ResponseEntity<Void> logout(@RequestHeader("X-User-Id") UUID userId) {
        authService.logout(userId);
        return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
    }

    @GetMapping("/me")
    public ResponseEntity<MeResponse> me(@RequestHeader("X-User-Id") UUID userId) {
        return ResponseEntity.ok(userService.getUser(userId));
    }
}
