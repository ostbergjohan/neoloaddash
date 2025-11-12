package se.neoloadstat.neoloadstat;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.apache.http.client.methods.CloseableHttpResponse;
import org.apache.http.client.methods.HttpUriRequest;
import org.apache.http.client.methods.RequestBuilder;
import org.apache.http.conn.ssl.NoopHostnameVerifier;
import org.apache.http.impl.client.CloseableHttpClient;
import org.apache.http.impl.client.HttpClients;
import org.apache.http.ssl.SSLContextBuilder;
import org.apache.http.ssl.TrustStrategy;
import org.apache.http.util.EntityUtils;
import org.json.JSONArray;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.event.ContextRefreshedEvent;
import org.springframework.context.event.EventListener;
import org.springframework.core.env.Environment;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import javax.net.ssl.SSLContext;
import java.io.IOException;
import java.net.URISyntaxException;
import java.security.KeyManagementException;
import java.security.KeyStoreException;
import java.security.NoSuchAlgorithmException;
import java.util.HashMap;
import java.util.Map;

@SpringBootApplication
@CrossOrigin(origins = "*")
public class NeoloadStatApplication {

    public static void main(String[] args) {
        SpringApplication.run(NeoloadStatApplication.class, args);
    }

    @Autowired
    private Environment env;

    private final ColorLogger colorLogger = new ColorLogger();

    private static final String CONTENT_TYPE = "application/json";
    private static final String ACCEPT = "application/json";
    private static final String AUTH_ERROR_MSG = "ERROR: Unauthorized - check API token";
    private static final String UNAUTHORIZED_KEYWORD = "Unauthorized";

    @RestController
    @Tag(name = "NeoLoad Test Statistics API", description = "Get statistics of NeoLoad tests by workspace")
    public static class ApiController {

        @Autowired
        private Environment env;

        private final ColorLogger colorLogger = new ColorLogger();

        private final NeoloadStatApplication app;

        public ApiController(NeoloadStatApplication app) {
            this.app = app;
        }

        @Operation(
                summary = "Get test statistics",
                description = "Retrieve test statistics filtered by optional start and end dates (Unix timestamp in seconds)."
        )
        @CrossOrigin("*")
        @GetMapping(value = "/test-statistics")
        public ResponseEntity<String> getTestStatistics(
                @Parameter(description = "Start date (Unix timestamp in seconds)", required = false)
                @RequestParam(required = false) Long startDate,
                @Parameter(description = "End date (Unix timestamp in seconds)", required = false)
                @RequestParam(required = false) Long endDate) {

            try {
                // Get all workspaces
                String workspacesResponse = app.doHttpGet(
                        env.getProperty("Server") + "/v3/workspaces",
                        env.getProperty("Token")
                );

                JSONArray workspaces = new JSONArray(workspacesResponse);
                JSONArray statistics = new JSONArray();

                // Loop through each workspace
                for (int i = 0; i < workspaces.length(); i++) {
                    JSONObject workspace = workspaces.getJSONObject(i);
                    String workspaceId = workspace.getString("id");
                    String workspaceName = workspace.getString("name");

                    colorLogger.logInfo("Processing workspace: " + workspaceName + " (" + workspaceId + ")");

                    // Get test results for this workspace
                    String url = env.getProperty("Server") + "/v3/workspaces/" + workspaceId + "/test-results?limit=200";
                    JSONArray testResults = new JSONArray(app.doHttpGet(url, env.getProperty("Token")));

                    Map<String, TestStats> testStatsMap = new HashMap<>();

                    for (int j = 0; j < testResults.length(); j++) {
                        JSONObject result = testResults.getJSONObject(j);

                        long testStart = result.optLong("startDate", 0);
                        long testEnd = result.optLong("endDate", 0);

                        long filterStart = (startDate != null) ? startDate : Long.MIN_VALUE;
                        long filterEnd = (endDate != null) ? endDate : Long.MAX_VALUE;

                        // Filter: include tests that overlap the period
                        if (testEnd < filterStart || testStart > filterEnd) {
                            continue;
                        }

                        String testId = result.optString("testId", "unknown");
                        String project = result.optString("project", "unknown");
                        String scenario = result.optString("scenario", "unknown");
                        String qualityStatus = result.optString("qualityStatus", "UNKNOWN");

                        String testKey = testId + "_" + project + "_" + scenario;

                        TestStats stats = testStatsMap.getOrDefault(testKey,
                                new TestStats(testId, project, scenario));

                        switch (qualityStatus) {
                            case "PASSED" -> stats.passed++;
                            case "FAILED" -> stats.failed++;
                            default -> stats.other++;
                        }

                        stats.total++;
                        testStatsMap.put(testKey, stats);
                    }

                    JSONObject workspaceStats = new JSONObject();
                    workspaceStats.put("workspaceId", workspaceId);
                    workspaceStats.put("workspaceName", workspaceName);

                    JSONArray tests = new JSONArray();
                    for (TestStats stats : testStatsMap.values()) {
                        JSONObject testStat = new JSONObject();
                        testStat.put("testId", stats.testId);
                        testStat.put("project", stats.project);
                        testStat.put("scenario", stats.scenario);
                        testStat.put("totalRuns", stats.total);
                        testStat.put("passed", stats.passed);
                        testStat.put("failed", stats.failed);
                        testStat.put("other", stats.other);
                        testStat.put("passRate", stats.total > 0 ?
                                String.format("%.2f%%", (stats.passed * 100.0 / stats.total)) : "0%");

                        tests.put(testStat);
                    }

                    workspaceStats.put("tests", tests);
                    workspaceStats.put("totalTests", testStatsMap.size());
                    statistics.put(workspaceStats);
                }

                JSONObject response = new JSONObject();
                response.put("startDate", startDate);
                response.put("endDate", endDate);
                response.put("workspaces", statistics);
                response.put("totalWorkspaces", workspaces.length());

                HttpHeaders headers = new HttpHeaders();
                headers.add(HttpHeaders.CACHE_CONTROL, "no-cache");
                headers.add(HttpHeaders.CONTENT_TYPE, "application/json; charset=UTF-8");

                return ResponseEntity.ok().headers(headers).body(response.toString(2));

            } catch (IOException | URISyntaxException e) {
                colorLogger.logError("Error fetching test statistics: " + e.getMessage());
                return ResponseEntity.status(500)
                        .body("{\"error\":\"" + e.getMessage() + "\"}");
            }
        }

        @Operation(summary = "Health check endpoint", description = "Returns status of the API")
        @GetMapping(value = "/healthcheck")
        public ResponseEntity<String> healthcheck() {
            HttpHeaders headers = new HttpHeaders();
            headers.add(HttpHeaders.CACHE_CONTROL, "no-cache");
            headers.add(HttpHeaders.CONTENT_TYPE, "text/plain; charset=UTF-8");
            headers.add(HttpHeaders.CONTENT_ENCODING, "UTF-8");
            return ResponseEntity.ok().headers(headers)
                    .body("{\"status\":\"ok\",\"service\":\"API Health Check\"}");
        }
    }

    @org.springframework.stereotype.Controller
    public static class HomeController {

        @GetMapping("/")
        public String redirectToSwagger() {
            return "redirect:/swagger-ui/index.html";
        }
    }

    @EventListener
    public void handleContextRefresh(ContextRefreshedEvent event) {
        if (env.getProperty("Server") == null || env.getProperty("Token") == null) {
            colorLogger.logError("NeoLoad API server and token must be set -e Server=\"http://XXX\" and -e Token=XXX");
            System.exit(0);
        }

        try {
            JSONObject jsonObj = new JSONObject(doHttpGet(env.getProperty("Server") + "/v3/information", env.getProperty("Token")));
            if (jsonObj.has("message")) {
                colorLogger.logError("message: " + jsonObj.getString("message"));
                colorLogger.logInfo("===========================================");
                System.exit(0);
            }
            colorLogger.logInfo("====== Environment and configuration ======");
            colorLogger.logInfo("front_url: " + jsonObj.getString("front_url"));
            colorLogger.logInfo("api_url: " + env.getProperty("Server"));
            colorLogger.logInfo("filestorage_url: " + jsonObj.getString("filestorage_url"));
            colorLogger.logInfo("version: " + jsonObj.getString("version"));
            colorLogger.logInfo("===========================================");
            colorLogger.logInfo("Swagger UI available at: http://localhost:8080/swagger-ui.html");
        } catch (IOException | URISyntaxException e) {
            throw new RuntimeException(e);
        }
    }



    public String doHttpGet(String url, String accountToken) throws IOException, URISyntaxException {
        HttpUriRequest request = RequestBuilder.get()
                .setUri(url)
                .setHeader(HttpHeaders.CONTENT_TYPE, CONTENT_TYPE)
                .setHeader(HttpHeaders.ACCEPT, ACCEPT)
                .setHeader("accountToken", accountToken)
                .build();

        return executeRequest(request);
    }

    private String executeRequest(HttpUriRequest request) throws IOException {
        try (CloseableHttpClient httpClient = createHttpClient();
             CloseableHttpResponse response = httpClient.execute(request)) {

            String result = EntityUtils.toString(response.getEntity());
            if (result.contains(UNAUTHORIZED_KEYWORD)) {
                colorLogger.logError(AUTH_ERROR_MSG);
                throw new IOException(AUTH_ERROR_MSG);
            }
            return result;
        }
    }

    private CloseableHttpClient createHttpClient() {
        try {
            SSLContext sslContext = SSLContextBuilder.create()
                    .loadTrustMaterial(null, (TrustStrategy) (cert, authType) -> true)
                    .build();

            return HttpClients.custom()
                    .setSSLHostnameVerifier(NoopHostnameVerifier.INSTANCE)
                    .setSSLContext(sslContext)
                    .build();
        } catch (NoSuchAlgorithmException | KeyManagementException | KeyStoreException e) {
            throw new RuntimeException("Failed to create SSL context for HTTP client", e);
        }
    }

    private static class TestStats {
        String testId;
        String project;
        String scenario;
        int total = 0;
        int passed = 0;
        int failed = 0;
        int other = 0;

        TestStats(String testId, String project, String scenario) {
            this.testId = testId;
            this.project = project;
            this.scenario = scenario;
        }
    }
}