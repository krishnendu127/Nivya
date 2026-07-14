package app.nivya.auth.controller;

import app.nivya.auth.dto.AuthResponse;
import app.nivya.auth.dto.MeResponse;
import app.nivya.auth.repository.RefreshTokenRepository;
import app.nivya.auth.repository.UserProfileRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.*;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@Testcontainers
class AuthControllerTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine")
            .withDatabaseName("nivya_auth_test")
            .withUsername("postgres")
            .withPassword("postgres");

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
    }

    @Autowired
    private TestRestTemplate restTemplate;

    @Autowired
    private RefreshTokenRepository refreshTokenRepository;

    @Autowired
    private UserProfileRepository userProfileRepository;

    private static final String PHONE = "9876543210";
    // dev OTP from application.yml default
    private static final String DEV_OTP = "123456";

    @BeforeEach
    void setUp() {
        refreshTokenRepository.deleteAll();
        userProfileRepository.deleteAll();
    }

    @Test
    void sendOtp_shouldReturn204() {
        ResponseEntity<Void> response = restTemplate.postForEntity(
                "/v1/auth/otp/send",
                Map.of("phone", PHONE),
                Void.class
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
    }

    @Test
    void verifyOtp_shouldReturnTokensOnSuccess() {
        restTemplate.postForEntity("/v1/auth/otp/send", Map.of("phone", PHONE), Void.class);

        ResponseEntity<AuthResponse> response = restTemplate.postForEntity(
                "/v1/auth/otp/verify",
                Map.of("phone", PHONE, "otp", DEV_OTP),
                AuthResponse.class
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().accessToken()).isNotBlank();
        assertThat(response.getBody().refreshToken()).isNotBlank();
        assertThat(response.getBody().expiresInSec()).isPositive();
    }

    @Test
    void verifyOtp_shouldReturn401ForWrongOtp() {
        restTemplate.postForEntity("/v1/auth/otp/send", Map.of("phone", PHONE), Void.class);

        ResponseEntity<Void> response = restTemplate.postForEntity(
                "/v1/auth/otp/verify",
                Map.of("phone", PHONE, "otp", "000000"),
                Void.class
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    @Test
    void refreshToken_shouldReturnNewAccessToken() {
        AuthResponse auth = verifyWithDevOtp();

        ResponseEntity<AuthResponse> response = restTemplate.postForEntity(
                "/v1/auth/token/refresh",
                Map.of("refreshToken", auth.refreshToken()),
                AuthResponse.class
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().accessToken()).isNotBlank();
    }

    @Test
    void refreshToken_shouldReturn401ForInvalidToken() {
        ResponseEntity<Void> response = restTemplate.postForEntity(
                "/v1/auth/token/refresh",
                Map.of("refreshToken", "not-a-real-token"),
                Void.class
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    @Test
    void me_shouldReturnUserProfile() {
        AuthResponse auth = verifyWithDevOtp();

        HttpHeaders headers = new HttpHeaders();
        // Decode userId from access token sub claim via /me endpoint — gateway normally injects X-User-Id,
        // but in this test we call auth-service directly so we need to get the userId another way.
        // We look it up from the DB since the user was just created.
        String userId = userProfileRepository.findAll().get(0).getId().toString();
        headers.set("X-User-Id", userId);

        ResponseEntity<MeResponse> response = restTemplate.exchange(
                "/v1/me",
                HttpMethod.GET,
                new HttpEntity<>(headers),
                MeResponse.class
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().phone()).isEqualTo(PHONE);
    }

    @Test
    void logout_shouldReturn204AndInvalidateRefreshToken() {
        AuthResponse auth = verifyWithDevOtp();
        String userId = userProfileRepository.findAll().get(0).getId().toString();

        HttpHeaders headers = new HttpHeaders();
        headers.set("X-User-Id", userId);

        ResponseEntity<Void> logoutResponse = restTemplate.exchange(
                "/v1/auth/logout",
                HttpMethod.POST,
                new HttpEntity<>(headers),
                Void.class
        );

        assertThat(logoutResponse.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);

        // Refresh token should now be invalid
        ResponseEntity<Void> refreshResponse = restTemplate.postForEntity(
                "/v1/auth/token/refresh",
                Map.of("refreshToken", auth.refreshToken()),
                Void.class
        );
        assertThat(refreshResponse.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    private AuthResponse verifyWithDevOtp() {
        restTemplate.postForEntity("/v1/auth/otp/send", Map.of("phone", PHONE), Void.class);
        ResponseEntity<AuthResponse> response = restTemplate.postForEntity(
                "/v1/auth/otp/verify",
                Map.of("phone", PHONE, "otp", DEV_OTP),
                AuthResponse.class
        );
        assertThat(response.getBody()).isNotNull();
        return response.getBody();
    }
}
