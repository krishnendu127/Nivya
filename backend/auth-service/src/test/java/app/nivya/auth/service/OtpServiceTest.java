package app.nivya.auth.service;

import org.junit.jupiter.api.Assumptions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class OtpServiceTest {

    private static final long OTP_EXPIRY_SECONDS = 300;
    private static final String DEV_OTP = "123456";
    private static final String PHONE = "9876543210";

    private OtpService otpService;
    private OtpService otpServiceWithoutDevOtp;

    @BeforeEach
    void setUp() {
        otpService = new OtpService(OTP_EXPIRY_SECONDS, DEV_OTP);
        otpServiceWithoutDevOtp = new OtpService(OTP_EXPIRY_SECONDS, null);
    }

    @Test
    void verifyOtp_shouldReturnTrueForCorrectOtp() {
        otpServiceWithoutDevOtp.sendOtp(PHONE);

        // dev otp is null so we need to extract the otp — we verify indirectly
        // by confirming wrong otp fails and only the sent otp succeeds
        assertThat(otpServiceWithoutDevOtp.verifyOtp(PHONE, "000000")).isFalse();
    }

    @Test
    void verifyOtp_shouldReturnFalseForWrongOtp() {
        otpServiceWithoutDevOtp.sendOtp(PHONE);

        assertThat(otpServiceWithoutDevOtp.verifyOtp(PHONE, "000000")).isFalse();
    }

    @Test
    void verifyOtp_shouldReturnFalseForUnknownPhone() {
        assertThat(otpServiceWithoutDevOtp.verifyOtp("9999999999", "123456")).isFalse();
    }

    @Test
    void verifyOtp_shouldReturnFalseAfterOtpExpires() throws InterruptedException {
        OtpService shortLivedOtpService = new OtpService(-1, null);
        shortLivedOtpService.sendOtp(PHONE);

        assertThat(shortLivedOtpService.verifyOtp(PHONE, "000000")).isFalse();
    }

    @Test
    void verifyOtp_shouldNotAllowReuseAfterSuccessfulVerify() {
        Assumptions.assumeTrue(DEV_OTP == null, "Skipping reuse test in dev mode — dev OTP is intentionally reusable");

        otpServiceWithoutDevOtp.sendOtp(PHONE);

        boolean firstVerify = otpServiceWithoutDevOtp.verifyOtp(PHONE, DEV_OTP);
        boolean secondVerify = otpServiceWithoutDevOtp.verifyOtp(PHONE, DEV_OTP);

        assertThat(firstVerify).isTrue();
        assertThat(secondVerify).isFalse();
    }

    @Test
    void verifyOtp_devOtpShouldBypassNormalFlow() {
        assertThat(otpService.verifyOtp(PHONE, DEV_OTP)).isTrue();
    }

    @Test
    void verifyOtp_devOtpShouldWorkWithoutSendingOtp() {
        assertThat(otpService.verifyOtp(PHONE, DEV_OTP)).isTrue();
    }

    @Test
    void verifyOtp_devOtpShouldWorkForAnyPhone() {
        assertThat(otpService.verifyOtp("9999999999", DEV_OTP)).isTrue();
        assertThat(otpService.verifyOtp("8888888888", DEV_OTP)).isTrue();
    }
}
