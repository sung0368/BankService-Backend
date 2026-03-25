package com.bankservice.user;

import com.bankservice.auth.dto.SignupRequest;
import jakarta.transaction.Transactional;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@Transactional
public class UserService {

    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;
    private final BCryptPasswordEncoder encoder;


    public UserService(UserRepository userRepository,
                       UserProfileRepository userProfileRepository,
                       BCryptPasswordEncoder encoder) {
        this.userRepository = userRepository;
        this.userProfileRepository = userProfileRepository;
        this.encoder = encoder;
    }

    public boolean existsByUserId(String userId) {
        return userRepository.existsByUserId(userId);
    }

    public boolean existsByEmail(String email) {
        return userRepository.existsByEmail(email);
    }

    public boolean existsByResidentNumber(String residentNumber) {
        String encrypted = encrypt(residentNumber); // 주민번호 암호화
        return userProfileRepository.existsByResidentNumberEncrypted(encrypted);    }


    public void signup(SignupRequest request) {

        // 1️⃣ 이메일 중복 체크
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new UserSignupException("이미 존재하는 이메일입니다");
        }
        if (userRepository.existsById(request.getUserId())) {
            throw new UserSignupException("이미 존재하는 아이디입니다");
        }


        // 2️⃣ User 생성 및 DB 즉시 반영 (세션 충돌 방지)
        User user = new User(
                request.getUserId(),
                request.getEmail(),
                encoder.encode(request.getPassword())
        );
        user = userRepository.saveAndFlush(user); // flush로 세션과 DB 동기화

        // 3️⃣ UserProfile 생성
        UserProfile profile = new UserProfile(
                user,
                request.getName(),
                encrypt(request.getResidentNumber()),
                request.getPhone(),
                request.getAddress()
        );
        userProfileRepository.save(profile);

        System.out.println("🔥 signup() 완료");
    }

    // 🔹 지금은 더미 (나중에 AES로 교체)
    private String encrypt(String value) {
        return value;
    }
}
