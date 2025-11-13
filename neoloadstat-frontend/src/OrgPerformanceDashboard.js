import React, { useState, useEffect, useCallback } from "react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts";
import {
    TrendingUp,
    TrendingDown,
    Activity,
    CheckCircle,
    XCircle,
    AlertCircle,
} from "lucide-react";
import { useSearchParams } from "react-router-dom";

const API_BASE_URL =
    "https://change.me/test-statistics";

const OrgPerformanceDashboard = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [lastUpdated, setLastUpdated] = useState(null);
    const [searchParams, setSearchParams] = useSearchParams();
    const [days, setDays] = useState(30);
    const [isDarkMode, setIsDarkMode] = useState(false);

    // --- LÄS URL PARAMETRAR MED useSearchParams ---
    useEffect(() => {
        const daysParam = parseInt(searchParams.get("days"), 10);
        const darkParam = searchParams.get("dark") === "true";

        if (!isNaN(daysParam)) setDays(daysParam);
        setIsDarkMode(darkParam);
    }, [searchParams]);

    // --- UPPDATERA URL NÄR DAYS ÄNDRAS ---
    const updateDays = (newDays) => {
        const params = new URLSearchParams(searchParams);
        params.set("days", newDays.toString());
        setSearchParams(params);
    };

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const now = new Date();
            const endEpoch = now.getTime();
            const startEpoch = new Date(
                now.getTime() - days * 24 * 60 * 60 * 1000
            ).getTime();
            const url = `${API_BASE_URL}?startDate=${startEpoch}&endDate=${endEpoch}`;
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const json = await response.json();
            setData(json);
            setLastUpdated(new Date());
        } catch (err) {
            console.error("❌ Error fetching data:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [days]);

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, [fetchData]);

    if (loading && !data) {
        return (
            <div
                style={{
                    minHeight: "100vh",
                    background: isDarkMode
                        ? "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)"
                        : "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                <div style={{ textAlign: "center" }}>
                    <div
                        style={{
                            width: "64px",
                            height: "64px",
                            border: `4px solid ${isDarkMode ? "#60a5fa" : "#2563eb"}`,
                            borderTop: `4px solid transparent`,
                            borderRadius: "50%",
                            animation: "spin 1s linear infinite",
                            margin: "0 auto 16px",
                        }}
                    ></div>
                    <p
                        style={{
                            fontSize: "1.25rem",
                            color: isDarkMode ? "#94a3b8" : "#475569",
                            fontWeight: "500",
                        }}
                    >
                        Loading Performance Dashboard...
                    </p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div
                style={{
                    minHeight: "100vh",
                    background: isDarkMode
                        ? "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)"
                        : "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                <div
                    style={{
                        backgroundColor: isDarkMode ? "#1e293b" : "#fff",
                        borderRadius: "16px",
                        boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
                        padding: "32px",
                        maxWidth: "448px",
                        textAlign: "center",
                        border: isDarkMode ? "1px solid #334155" : "none",
                    }}
                >
                    <AlertCircle
                        style={{
                            width: "64px",
                            height: "64px",
                            color: isDarkMode ? "#f87171" : "#ef4444",
                            margin: "0 auto 16px",
                        }}
                    />
                    <h2
                        style={{
                            fontSize: "1.5rem",
                            fontWeight: "bold",
                            color: isDarkMode ? "#f1f5f9" : "#1e293b",
                            marginBottom: "8px",
                        }}
                    >
                        Connection Error
                    </h2>
                    <p
                        style={{
                            color: isDarkMode ? "#94a3b8" : "#64748b",
                            marginBottom: "24px",
                        }}
                    >
                        Unable to load performance data: {error}
                    </p>
                    <button
                        onClick={fetchData}
                        style={{
                            backgroundColor: isDarkMode ? "#3b82f6" : "#2563eb",
                            color: "#fff",
                            padding: "12px 24px",
                            borderRadius: "8px",
                            border: "none",
                            cursor: "pointer",
                            fontSize: "1rem",
                            fontWeight: "600",
                            transition: "background-color 0.2s",
                        }}
                        onMouseOver={(e) =>
                            (e.target.style.backgroundColor = isDarkMode
                                ? "#2563eb"
                                : "#1d4ed8")
                        }
                        onMouseOut={(e) =>
                            (e.target.style.backgroundColor = isDarkMode
                                ? "#3b82f6"
                                : "#2563eb")
                        }
                    >
                        Retry Connection
                    </button>
                </div>
            </div>
        );
    }

    if (!data) return null;

    const calculateOverallStats = () => {
        let totalRuns = 0,
            totalPassed = 0,
            totalFailed = 0;
        data.workspaces.forEach((ws) => {
            ws.tests.forEach((test) => {
                totalRuns += test.totalRuns;
                totalPassed += test.passed;
                totalFailed += test.failed;
            });
        });
        return { totalRuns, totalPassed, totalFailed };
    };

    const stats = calculateOverallStats();
    const passRate =
        stats.totalRuns > 0
            ? ((stats.totalPassed / stats.totalRuns) * 100).toFixed(1)
            : 0;
    const failRate =
        stats.totalRuns > 0
            ? ((stats.totalFailed / stats.totalRuns) * 100).toFixed(1)
            : 0;

    const workspaceData = data.workspaces
        .filter((ws) => ws.tests.length > 0)
        .map((ws) => {
            const wsStats = ws.tests.reduce(
                (acc, test) => ({
                    passed: acc.passed + test.passed,
                    failed: acc.failed + test.failed,
                    total: acc.total + test.totalRuns,
                }),
                { passed: 0, failed: 0, total: 0 }
            );
            const passRate = wsStats.total > 0 ? ((wsStats.passed / wsStats.total) * 100).toFixed(1) : 0;
            return {
                name: ws.workspaceName,
                passed: wsStats.passed,
                failed: wsStats.failed,
                total: wsStats.total,
                passRate: parseFloat(passRate),
            };
        })
        .sort((a, b) => b.total - a.total);

    const getStatusColor = (rate) => {
        if (rate >= 90) return isDarkMode ? "#34d399" : "#059669";
        if (rate >= 70) return isDarkMode ? "#f59e0b" : "#d97706";
        return isDarkMode ? "#f87171" : "#dc2626";
    };

    const getStatusBg = (rate) => {
        if (rate >= 90)
            return {
                bg: isDarkMode ? "#064e3b" : "#f0fdf4",
                border: isDarkMode ? "#10b981" : "#bbf7d0",
            };
        if (rate >= 70)
            return {
                bg: isDarkMode ? "#1c4532" : "#fefce8",
                border: isDarkMode ? "#f59e0b" : "#fde047",
            };
        return {
            bg: isDarkMode ? "#450a0a" : "#fef2f2",
            border: isDarkMode ? "#dc2626" : "#fecaca",
        };
    };

    const getStatusLabel = (rate) => {
        if (rate >= 90) return "✓ Excellent";
        if (rate >= 70) return "⚠ Good";
        return "✗ Critical";
    };

    const getStatusBadgeStyle = (rate) => {
        if (rate >= 90)
            return {
                bg: isDarkMode ? "#064e3b" : "#dcfce7",
                color: isDarkMode ? "#34d399" : "#15803d",
            };
        if (rate >= 70)
            return {
                bg: isDarkMode ? "#1c4532" : "#fef9c3",
                color: isDarkMode ? "#f59e0b" : "#a16207",
            };
        return {
            bg: isDarkMode ? "#450a0a" : "#fee2e2",
            color: isDarkMode ? "#f87171" : "#991b1b",
        };
    };

    const statusBg = getStatusBg(parseFloat(passRate));

    return (
        <div
            style={{
                minHeight: "100vh",
                background: isDarkMode
                    ? "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)"
                    : "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #f8fafc 100%)",
                fontFamily: "system-ui, -apple-system, sans-serif",
                color: isDarkMode ? "#f1f5f9" : "#1e293b",
            }}
        >
            <style>
                {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
          .hover-shadow:hover {
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
            transform: translateY(-2px);
          }
          .hover-row:hover {
            background-color: ${isDarkMode ? "#1e293b" : "#f8fafc"};
          }
        `}
            </style>

            {/* Header */}
            <div
                style={{
                    backgroundColor: isDarkMode ? "#1e293b" : "#fff",
                    borderBottom: isDarkMode ? "1px solid #334155" : "1px solid #e2e8f0",
                    boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
                }}
            >
                <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "24px 32px" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div>
                            <h1
                                style={{
                                    fontSize: "2rem",
                                    fontWeight: "bold",
                                    color: isDarkMode ? "#f1f5f9" : "#1e293b",
                                    marginBottom: "4px",
                                }}
                            >
                                NeoLoad Performance Dashboard
                            </h1>
                            <p
                                style={{
                                    color: isDarkMode ? "#94a3b8" : "#64748b",
                                    fontSize: "0.875rem",
                                }}
                            >
                                Real-time organization-wide test performance monitoring
                            </p>
                        </div>
                        <div style={{ textAlign: "right" }}>
                            <div
                                style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "8px",
                                    backgroundColor: isDarkMode ? "#0f172a" : "#dbeafe",
                                    border: isDarkMode ? "1px solid #334155" : "1px solid #93c5fd",
                                    padding: "8px 16px",
                                    borderRadius: "8px",
                                }}
                            >
                                <div
                                    style={{
                                        width: "8px",
                                        height: "8px",
                                        backgroundColor: isDarkMode ? "#60a5fa" : "#2563eb",
                                        borderRadius: "50%",
                                        animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
                                    }}
                                ></div>
                                <span
                                    style={{
                                        fontSize: "0.875rem",
                                        fontWeight: "600",
                                        color: isDarkMode ? "#60a5fa" : "#1e40af",
                                    }}
                                >
                  Last {days} days
                </span>
                            </div>
                            {lastUpdated && (
                                <p
                                    style={{
                                        fontSize: "0.75rem",
                                        color: isDarkMode ? "#94a3b8" : "#94a3b8",
                                        marginTop: "8px",
                                    }}
                                >
                                    Updated: {lastUpdated.toLocaleTimeString()}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "32px" }}>
                {/* KPI Cards */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "24px", marginBottom: "32px" }}>
                    <div
                        className="hover-shadow"
                        style={{
                            backgroundColor: isDarkMode ? "#1e293b" : "#fff",
                            borderRadius: "12px",
                            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                            border: isDarkMode ? "1px solid #334155" : "1px solid #e2e8f0",
                            padding: "24px",
                            transition: "all 0.3s",
                        }}
                    >
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                            <div
                                style={{
                                    padding: "12px",
                                    backgroundColor: isDarkMode ? "#0f172a" : "#dbeafe",
                                    borderRadius: "8px",
                                }}
                            >
                                <Activity
                                    style={{
                                        width: "24px",
                                        height: "24px",
                                        color: isDarkMode ? "#60a5fa" : "#2563eb",
                                    }}
                                />
                            </div>
                        </div>
                        <p
                            style={{
                                fontSize: "0.75rem",
                                fontWeight: "600",
                                color: isDarkMode ? "#94a3b8" : "#64748b",
                                textTransform: "uppercase",
                                letterSpacing: "0.05em",
                                marginBottom: "4px",
                            }}
                        >
                            Total Runs
                        </p>
                        <p
                            style={{
                                fontSize: "2rem",
                                fontWeight: "bold",
                                color: isDarkMode ? "#f1f5f9" : "#1e293b",
                            }}
                        >
                            {stats.totalRuns.toLocaleString()}
                        </p>
                    </div>
                    <div
                        className="hover-shadow"
                        style={{
                            backgroundColor: isDarkMode ? "#1e293b" : "#fff",
                            borderRadius: "12px",
                            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                            border: isDarkMode ? "1px solid #334155" : "1px solid #e2e8f0",
                            padding: "24px",
                            transition: "all 0.3s",
                        }}
                    >
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                            <div
                                style={{
                                    padding: "12px",
                                    backgroundColor: isDarkMode ? "#064e3b" : "#dcfce7",
                                    borderRadius: "8px",
                                }}
                            >
                                <CheckCircle
                                    style={{
                                        width: "24px",
                                        height: "24px",
                                        color: isDarkMode ? "#34d399" : "#059669",
                                    }}
                                />
                            </div>
                        </div>
                        <p
                            style={{
                                fontSize: "0.75rem",
                                fontWeight: "600",
                                color: isDarkMode ? "#94a3b8" : "#64748b",
                                textTransform: "uppercase",
                                letterSpacing: "0.05em",
                                marginBottom: "4px",
                            }}
                        >
                            Passed
                        </p>
                        <p
                            style={{
                                fontSize: "2rem",
                                fontWeight: "bold",
                                color: isDarkMode ? "#34d399" : "#059669",
                            }}
                        >
                            {stats.totalPassed.toLocaleString()}
                        </p>
                        <p
                            style={{
                                fontSize: "0.75rem",
                                color: isDarkMode ? "#94a3b8" : "#94a3b8",
                                marginTop: "4px",
                            }}
                        >
                            {passRate}% success rate
                        </p>
                    </div>
                    <div
                        className="hover-shadow"
                        style={{
                            backgroundColor: isDarkMode ? "#1e293b" : "#fff",
                            borderRadius: "12px",
                            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                            border: isDarkMode ? "1px solid #334155" : "1px solid #e2e8f0",
                            padding: "24px",
                            transition: "all 0.3s",
                        }}
                    >
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                            <div
                                style={{
                                    padding: "12px",
                                    backgroundColor: isDarkMode ? "#450a0a" : "#fee2e2",
                                    borderRadius: "8px",
                                }}
                            >
                                <XCircle
                                    style={{
                                        width: "24px",
                                        height: "24px",
                                        color: isDarkMode ? "#f87171" : "#dc2626",
                                    }}
                                />
                            </div>
                        </div>
                        <p
                            style={{
                                fontSize: "0.75rem",
                                fontWeight: "600",
                                color: isDarkMode ? "#94a3b8" : "#64748b",
                                textTransform: "uppercase",
                                letterSpacing: "0.05em",
                                marginBottom: "4px",
                            }}
                        >
                            Failed
                        </p>
                        <p
                            style={{
                                fontSize: "2rem",
                                fontWeight: "bold",
                                color: isDarkMode ? "#f87171" : "#dc2626",
                            }}
                        >
                            {stats.totalFailed.toLocaleString()}
                        </p>
                        <p
                            style={{
                                fontSize: "0.75rem",
                                color: isDarkMode ? "#94a3b8" : "#94a3b8",
                                marginTop: "4px",
                            }}
                        >
                            {failRate}% failure rate
                        </p>
                    </div>
                    <div
                        className="hover-shadow"
                        style={{
                            backgroundColor: isDarkMode ? "#1e293b" : "#fff",
                            borderRadius: "12px",
                            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                            border: `2px solid ${statusBg.border}`,
                            padding: "24px",
                            backgroundColor: statusBg.bg,
                            transition: "all 0.3s",
                        }}
                    >
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                            <div
                                style={{
                                    padding: "12px",
                                    backgroundColor: parseFloat(passRate) >= 70 ? (isDarkMode ? "#064e3b" : "#dcfce7") : (isDarkMode ? "#450a0a" : "#fee2e2"),
                                    borderRadius: "8px",
                                }}
                            >
                                {parseFloat(passRate) >= 70 ? (
                                    <TrendingUp
                                        style={{
                                            width: "24px",
                                            height: "24px",
                                            color: isDarkMode ? "#34d399" : "#059669",
                                        }}
                                    />
                                ) : (
                                    <TrendingDown
                                        style={{
                                            width: "24px",
                                            height: "24px",
                                            color: isDarkMode ? "#f87171" : "#dc2626",
                                        }}
                                    />
                                )}
                            </div>
                        </div>
                        <p
                            style={{
                                fontSize: "0.75rem",
                                fontWeight: "600",
                                color: isDarkMode ? "#94a3b8" : "#64748b",
                                textTransform: "uppercase",
                                letterSpacing: "0.05em",
                                marginBottom: "4px",
                            }}
                        >
                            Pass Rate
                        </p>
                        <p
                            style={{
                                fontSize: "2rem",
                                fontWeight: "bold",
                                color: getStatusColor(parseFloat(passRate)),
                            }}
                        >
                            {passRate}%
                        </p>
                        <p
                            style={{
                                fontSize: "0.75rem",
                                color: getStatusColor(parseFloat(passRate)),
                                marginTop: "4px",
                            }}
                        >
                            {parseFloat(passRate) >= 90
                                ? "Excellent"
                                : parseFloat(passRate) >= 70
                                    ? "Good"
                                    : "Needs attention"}
                        </p>
                    </div>
                </div>

                {/* Main Chart */}
                <div
                    style={{
                        backgroundColor: isDarkMode ? "#1e293b" : "#fff",
                        borderRadius: "12px",
                        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                        border: isDarkMode ? "1px solid #334155" : "1px solid #e2e8f0",
                        padding: "32px",
                        marginBottom: "32px",
                    }}
                >
                    <div style={{ marginBottom: "24px" }}>
                        <h2
                            style={{
                                fontSize: "1.25rem",
                                fontWeight: "bold",
                                color: isDarkMode ? "#f1f5f9" : "#1e293b",
                                marginBottom: "4px",
                            }}
                        >
                            Performance by Team & Workspace
                        </h2>
                        <p
                            style={{
                                fontSize: "0.875rem",
                                color: isDarkMode ? "#94a3b8" : "#64748b",
                            }}
                        >
                            Test results across all workspaces
                        </p>
                    </div>
                    <ResponsiveContainer width="100%" height={450}>
                        <BarChart data={workspaceData} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
                            <defs>
                                <linearGradient id="passedGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor={isDarkMode ? "#34d399" : "#10b981"} stopOpacity={0.9} />
                                    <stop offset="100%" stopColor={isDarkMode ? "#34d399" : "#10b981"} stopOpacity={0.7} />
                                </linearGradient>
                                <linearGradient id="failedGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor={isDarkMode ? "#f87171" : "#ef4444"} stopOpacity={0.9} />
                                    <stop offset="100%" stopColor={isDarkMode ? "#f87171" : "#ef4444"} stopOpacity={0.7} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid
                                strokeDasharray="3 3"
                                stroke={isDarkMode ? "#334155" : "#e2e8f0"}
                                vertical={false}
                            />
                            <XAxis
                                dataKey="name"
                                stroke={isDarkMode ? "#94a3b8" : "#64748b"}
                                angle={-45}
                                textAnchor="end"
                                height={100}
                                fontSize={13}
                                tickLine={false}
                                axisLine={{ stroke: isDarkMode ? "#475569" : "#cbd5e1" }}
                            />
                            <YAxis
                                stroke={isDarkMode ? "#94a3b8" : "#64748b"}
                                fontSize={13}
                                tickLine={false}
                                axisLine={{ stroke: isDarkMode ? "#475569" : "#cbd5e1" }}
                                label={{
                                    value: "Test Runs",
                                    angle: -90,
                                    position: "insideLeft",
                                    style: { fill: isDarkMode ? "#94a3b8" : "#64748b", fontSize: 13 },
                                }}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: isDarkMode ? "rgba(30, 41, 59, 0.98)" : "rgba(255, 255, 255, 0.98)",
                                    border: isDarkMode ? "1px solid #334155" : "1px solid #e2e8f0",
                                    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                                    borderRadius: "12px",
                                    padding: "12px",
                                }}
                                labelStyle={{ color: isDarkMode ? "#f1f5f9" : "#1e293b", fontWeight: "bold", marginBottom: "8px" }}
                                formatter={(value, name) => [
                                    `${value.toLocaleString()} tests`,
                                    name.charAt(0).toUpperCase() + name.slice(1),
                                ]}
                            />
                            <Legend
                                wrapperStyle={{ paddingTop: "20px" }}
                                iconType="circle"
                                formatter={(value) => value.charAt(0).toUpperCase() + value.slice(1)}
                            />
                            <Bar dataKey="passed" stackId="a" fill="url(#passedGradient)" radius={[0, 0, 0, 0]} />
                            <Bar dataKey="failed" stackId="a" fill="url(#failedGradient)" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default OrgPerformanceDashboard;
