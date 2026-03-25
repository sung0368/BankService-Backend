package com.bankservice.account;

import org.springframework.data.jpa.repository.JpaRepository;

public interface AccountAuthRepository extends JpaRepository<AccountAuth, Long> {
}
