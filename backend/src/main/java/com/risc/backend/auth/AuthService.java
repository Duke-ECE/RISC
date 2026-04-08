package com.risc.backend.auth;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AuthService {
  private final Map<String, Account> accountsByUsername = new HashMap<>();
  private final Map<String, String> tokenToUsername = new HashMap<>();

  public synchronized String register(String username, String password) {
    String normalized = normalize(username);
    if (accountsByUsername.containsKey(normalized)) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Username already exists.");
    }
    accountsByUsername.put(normalized, new Account(normalized, password));
    return issueToken(normalized);
  }

  public synchronized String login(String username, String password) {
    String normalized = normalize(username);
    Account account = accountsByUsername.get(normalized);
    if (account == null || !account.password().equals(password)) {
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid username or password.");
    }
    return issueToken(normalized);
  }

  public synchronized String requireUsername(String token) {
    if (token == null || token.isBlank()) {
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Missing auth token.");
    }
    String username = tokenToUsername.get(token);
    if (username == null) {
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid auth token.");
    }
    return username;
  }

  private String issueToken(String username) {
    String token = UUID.randomUUID().toString();
    tokenToUsername.put(token, username);
    return token;
  }

  private String normalize(String username) {
    String normalized = username == null ? "" : username.trim();
    if (normalized.isBlank()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Username cannot be blank.");
    }
    return normalized;
  }

  private record Account(String username, String password) {}
}
