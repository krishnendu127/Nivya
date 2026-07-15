package app.nivya.common.crypto;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.Cipher;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.Base64;

@Converter
@Component
public class PanEncryptionConverter implements AttributeConverter<String, String> {

    private static final String ALGORITHM      = "AES/GCM/NoPadding";
    private static final int    GCM_IV_LENGTH  = 12;
    private static final int    GCM_TAG_LENGTH = 128;

    private static SecretKey secretKey;

    @Component
    public static class KeyInitializer {
        public KeyInitializer(@Value("${nivya.pan.encryption-key}") String base64Key) {
            byte[] keyBytes = Base64.getDecoder().decode(base64Key);
            PanEncryptionConverter.secretKey = new SecretKeySpec(keyBytes, "AES");
        }
    }

    @Override
    public String convertToDatabaseColumn(String pan) {
        if (pan == null || pan.isBlank()) return null;
        if (secretKey == null) throw new IllegalStateException("Encryption key not initialized");

        try {
            byte[] iv = new byte[GCM_IV_LENGTH];
            new SecureRandom().nextBytes(iv);

            Cipher cipher = Cipher.getInstance(ALGORITHM);
            cipher.init(Cipher.ENCRYPT_MODE, secretKey, new GCMParameterSpec(GCM_TAG_LENGTH, iv));

            byte[] encrypted = cipher.doFinal(pan.getBytes(StandardCharsets.UTF_8));

            byte[] ivAndCiphertext = ByteBuffer.allocate(iv.length + encrypted.length)
                    .put(iv)
                    .put(encrypted)
                    .array();

            return Base64.getEncoder().encodeToString(ivAndCiphertext);
        } catch (Exception e) {
            throw new IllegalStateException("Failed to encrypt PAN", e);
        }
    }

    @Override
    public String convertToEntityAttribute(String encrypted) {
        if (encrypted == null || encrypted.isBlank()) return null;
        if (secretKey == null) throw new IllegalStateException("Encryption key not initialized");

        try {
            byte[] ivAndCiphertext = Base64.getDecoder().decode(encrypted);
            ByteBuffer buffer = ByteBuffer.wrap(ivAndCiphertext);

            byte[] iv = new byte[GCM_IV_LENGTH];
            buffer.get(iv);

            byte[] ciphertext = new byte[buffer.remaining()];
            buffer.get(ciphertext);

            Cipher cipher = Cipher.getInstance(ALGORITHM);
            cipher.init(Cipher.DECRYPT_MODE, secretKey, new GCMParameterSpec(GCM_TAG_LENGTH, iv));

            return new String(cipher.doFinal(ciphertext), StandardCharsets.UTF_8);
        } catch (Exception e) {
            throw new IllegalStateException("Failed to decrypt PAN", e);
        }
    }
}
