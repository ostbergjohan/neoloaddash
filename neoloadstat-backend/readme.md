# 📦 NeoLoad Statistics Backend API

A lightweight Spring Boot service that fetches and aggregates NeoLoad test results from the NeoLoad Enterprise API — for consumption by the [NeoLoad Dashboard Frontend](https://github.com/your-repo/neoloadstat-frontend).

> ⚠️ **This backend is required** for the frontend to display any data.

---

## 🧩 What It Does

- **Fetches test results** from NeoLoad Enterprise API (`/v3/workspaces`, `/v3/workspaces/{id}/test-results`)
- **Aggregates statistics** per test (scenario/project) — counting `passed`, `failed`, `other`
- **Filters by date range** (optional `startDate` and `endDate` in Unix timestamp seconds)
- **Returns structured JSON** with:
    - List of workspaces
    - Per-workspace test stats (total runs, passed, failed, pass rate)
    - Overall summary (total workspaces, date range)
- **Health check endpoint** at `/healthcheck`
- **Swagger UI** available at `/swagger-ui.html` (for API documentation)

---

## ⚙️ Required Configuration

The backend requires two environment variables to start:

| Variable | Description |
|----------|-------------|
| `Server` | Base URL of your NeoLoad Enterprise API (e.g., `https://neoload-api.example.com`) |
| `Token` | Account token for authenticating with NeoLoad Enterprise API |

### Example (Linux/macOS):

```bash
export Server="https://neoload-api.example.com"
export Token="your-neoload-account-token"
java -jar neoloadstat.jar