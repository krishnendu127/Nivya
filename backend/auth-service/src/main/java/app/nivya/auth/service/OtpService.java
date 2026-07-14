package app.nivya.auth.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class OtpService {

    private record OtpEntry(String otp, Instant expiresAt) {}

    private final Map<String, OtpEntry> otpStore = new ConcurrentHashMap<>();
    private final SecureRandom secureRandom = new SecureRandom();

    private final long otpExpirySeconds;
    private final String devOtp;

    public OtpService(
            @Value("${nivya.otp.expiry-seconds}") long otpExpirySeconds,
            @Value("${nivya.otp.dev-otp}") String devOtp
    ) {
        this.otpExpirySeconds = otpExpirySeconds;
        this.devOtp = devOtp;
    }

    public void sendOtp(String phoneNumber) {
        String currentOtp = String.format("%06d", secureRandom.nextInt(1_000_000));
        otpStore.put(phoneNumber, new OtpEntry(currentOtp, Instant.now().plusSeconds(otpExpirySeconds)));
        // TODO: integrate SMS provider to send OTP to phone
    }

    public boolean verifyOtp(String phoneNumber, String givenOtp) {
        if (devOtp != null && givenOtp.equals(devOtp)) return true;

        OtpEntry otpEntry = otpStore.get(phoneNumber);
        if (otpEntry == null || Instant.now().isAfter(otpEntry.expiresAt())) {
            otpStore.remove(phoneNumber);
            return false;
        }

        boolean valid = otpEntry.otp().equals(givenOtp);
        if (valid) otpStore.remove(phoneNumber);
        return valid;
    }
}
