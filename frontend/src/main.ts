import "./styles.css";

type HealthStatus = {
  service: string;
  status: string;
};

const app = document.querySelector<HTMLDivElement>("#app");

if (!app) {
  throw new Error("App container not found.");
}

const healthEndpoint = "http://127.0.0.1:8080/api/health";

const createLayout = () => `
  <main class="page">
    <section class="panel">
      <p class="eyebrow">RISC</p>
      <h1>Frontend is ready.</h1>
      <p class="description">
        The page calls the Spring Boot health endpoint and shows migration-backed backend availability.
      </p>
      <button id="health-button" class="action">Check backend</button>
      <pre id="health-result" class="result">Waiting for request...</pre>
    </section>
  </main>
`;

const renderResult = (message: string) => {
  const result = document.querySelector<HTMLPreElement>("#health-result");

  if (result) {
    result.textContent = message;
  }
};

const fetchHealthStatus = async () => {
  renderResult("Loading backend status...");

  try {
    const response = await fetch(healthEndpoint);

    if (!response.ok) {
      throw new Error(`Unexpected status: ${response.status}`);
    }

    const data = (await response.json()) as HealthStatus;
    renderResult(JSON.stringify(data, null, 2));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    renderResult(`Backend request failed: ${message}`);
  }
};

app.innerHTML = createLayout();

const healthButton = document.querySelector<HTMLButtonElement>("#health-button");
healthButton?.addEventListener("click", () => {
  void fetchHealthStatus();
});
