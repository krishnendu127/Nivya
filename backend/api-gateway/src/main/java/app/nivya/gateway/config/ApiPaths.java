package app.nivya.gateway.config;

public final class ApiPaths {

    private ApiPaths() {}

    public static final String AUTH_OTP_SEND     = "/v1/auth/otp/send";
    public static final String AUTH_OTP_VERIFY   = "/v1/auth/otp/verify";
    public static final String AUTH_TOKEN_REFRESH = "/v1/auth/token/refresh";

    public static final String[] PUBLIC_PATHS = {
            AUTH_OTP_SEND,
            AUTH_OTP_VERIFY,
            AUTH_TOKEN_REFRESH
    };
}
