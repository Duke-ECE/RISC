package com.risc.backend.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
class AuthIntegrationTest {
  @Autowired
  private MockMvc mockMvc;

  @Autowired
  private ObjectMapper objectMapper;

  @Test
  void registerLoginAndMeExposeAuthenticatedAccount() throws Exception {
    String username = uniqueUsername("account");
    String token = register(username, "pw123");

    JsonNode me = getJson(get("/api/auth/me").header("X-Auth-Token", token));
    assertThat(me.get("username").asText()).isEqualTo(username);
    assertThat(me.get("activeGames")).isEmpty();

    JsonNode login = getJson(post("/api/auth/login")
        .contentType(MediaType.APPLICATION_JSON)
        .content("""
            {"username":"%s","password":"pw123"}
            """.formatted(username)));
    assertThat(login.get("username").asText()).isEqualTo(username);
    assertThat(login.get("token").asText()).isNotBlank();
    assertThat(login.get("activeGames")).isEmpty();
  }

  @Test
  void reloginCanReturnToExistingGame() throws Exception {
    String username = uniqueUsername("returner");
    String token = register(username, "pw123");

    JsonNode created = getJson(post("/api/rooms").header("X-Auth-Token", token));
    String roomId = created.get("roomId").asText();

    JsonNode login = getJson(post("/api/auth/login")
        .contentType(MediaType.APPLICATION_JSON)
        .content("""
            {"username":"%s","password":"pw123"}
            """.formatted(username)));
    String nextToken = login.get("token").asText();
    assertThat(login.get("activeGames")).hasSize(1);
    assertThat(login.get("activeGames").get(0).get("roomId").asText()).isEqualTo(roomId);

    JsonNode joinedAgain = getJson(post("/api/rooms/%s/join".formatted(roomId)).header("X-Auth-Token", nextToken));
    assertThat(joinedAgain.get("playerId").asText()).isEqualTo("GREEN");

    JsonNode roomView = getJson(get("/api/rooms/%s".formatted(roomId)).header("X-Auth-Token", nextToken));
    assertThat(roomView.get("roomId").asText()).isEqualTo(roomId);
    assertThat(roomView.get("currentPlayer").asText()).isEqualTo("GREEN");
  }

  @Test
  void sameAccountCanTrackMultipleGames() throws Exception {
    String username = uniqueUsername("multi");
    String token = register(username, "pw123");

    String firstRoomId = getJson(post("/api/rooms").header("X-Auth-Token", token)).get("roomId").asText();
    String secondRoomId = getJson(post("/api/rooms").header("X-Auth-Token", token)).get("roomId").asText();

    JsonNode activeGames = getJson(get("/api/rooms").header("X-Auth-Token", token));
    assertThat(activeGames).hasSize(2);
    assertThat(activeGames.findValuesAsText("roomId")).containsExactlyInAnyOrder(firstRoomId, secondRoomId);
  }

  private String register(String username, String password) throws Exception {
    JsonNode response = getJson(post("/api/auth/register")
        .contentType(MediaType.APPLICATION_JSON)
        .content("""
            {"username":"%s","password":"%s"}
            """.formatted(username, password)));
    return response.get("token").asText();
  }

  private JsonNode getJson(org.springframework.test.web.servlet.RequestBuilder request) throws Exception {
    String body = mockMvc.perform(request)
        .andExpect(status().isOk())
        .andReturn()
        .getResponse()
        .getContentAsString();
    return objectMapper.readTree(body);
  }

  private String uniqueUsername(String prefix) {
    return prefix + "-" + System.nanoTime();
  }
}
