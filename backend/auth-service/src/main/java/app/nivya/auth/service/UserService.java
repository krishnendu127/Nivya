package app.nivya.auth.service;

import app.nivya.auth.domain.KycStatus;
import app.nivya.auth.domain.UserProfile;
import app.nivya.auth.dto.MeResponse;
import app.nivya.auth.repository.UserProfileRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

@Service
public class UserService {

    private final UserProfileRepository userProfileRepository;

    public UserService(UserProfileRepository userProfileRepository) {
        this.userProfileRepository = userProfileRepository;
    }

    @Transactional
    public UUID notifyUserLogin(String phoneNumber) {
        return userProfileRepository.findByPhone(phoneNumber)
                .orElseGet(() -> createUser(phoneNumber))
                .getId();
    }

    private UserProfile createUser(String phoneNumber) {
        UserProfile newUser = new UserProfile();
        newUser.setPhone(phoneNumber);
        newUser.setKycStatus(KycStatus.pending);
        return userProfileRepository.save(newUser);
    }

    public MeResponse getUser(UUID userId) {
        UserProfile userProfile = userProfileRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        return new MeResponse(
                userProfile.getId(),
                userProfile.getPhone(),
                userProfile.getEmail(),
                userProfile.getKycStatus(),
                userProfile.getName(),
                userProfile.getDob()
        );
    }
}
