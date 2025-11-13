import React, { useState, useEffect, useCallback } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp, TrendingDown, Activity, CheckCircle, XCircle, AlertTriangle, Download, Filter } from "lucide-react";

const API_BASE_URL = "https://change.me/test-statistics";

const TestStatsDashboard = () => {
    const [data, setData] = useState(null);
    const [selectedWorkspace, setSelectedWorkspace] = useState("all");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);ch
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [excludedWorkspaces, setExcludedWorkspaces] = useState([]);
    const [pendingExclusions, setPendingExclusions] = useState([]);
    const [expandedWorkspace, setExpandedWorkspace] = useState(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            let url = API_BASE_URL;
            const params = new URLSearchParams();
            if (startDate) {
                const startEpoch = new Date(startDate + "T00:00:00").getTime();
                params.append("startDate", startEpoch.toString());
            }
            if (endDate) {
                const endEpoch = new Date(endDate + "T23:59:59").getTime();
                params.append("endDate", endEpoch.toString());
            }
            if (params.toString()) url += "?" + params.toString();
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const json = await response.json();
            setData(json);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [startDate, endDate]);

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, [fetchData]);

    const calculateOverallStats = () => {
        let totalRuns = 0, totalPassed = 0, totalFailed = 0;
        data.workspaces.filter(ws => !excludedWorkspaces.includes(ws.workspaceId)).forEach((ws) => {
            ws.tests.forEach((test) => {
                totalRuns += test.totalRuns;
                totalPassed += test.passed;
                totalFailed += test.failed;
            });
        });
        return { totalRuns, totalPassed, totalFailed };
    };

    const getStatusColor = (status) => {
        switch(status) {
            case 'excellent': return '#10b981';
            case 'good': return '#3b82f6';
            case 'attention': return '#f59e0b';
            case 'critical': return '#ef4444';
            default: return '#6b7280';
        }
    };

    const getStatusBadge = (status) => {
        const styles = {
            excellent: { bg: '#dcfce7', color: '#15803d', icon: '✓' },
            good: { bg: '#dbeafe', color: '#1e40af', icon: '◐' },
            attention: { bg: '#fef9c3', color: '#a16207', icon: '⚠' },
            critical: { bg: '#fee2e2', color: '#991b1b', icon: '✗' },
        };
        const style = styles[status] || styles.critical;
        return { ...style, label: status.charAt(0).toUpperCase() + status.slice(1) };
    };

    const getTestStatus = (passRate) => {
        const rate = parseFloat(passRate);
        if (rate >= 90) return 'excellent';
        if (rate >= 70) return 'good';
        if (rate >= 50) return 'attention';
        return 'critical';
    };

    const toggleWorkspace = (workspaceId) => {
        setExpandedWorkspace(expandedWorkspace === workspaceId ? null : workspaceId);
    };

    const exportCSV = () => {
        if (!workspaceData || workspaceData.length === 0) return;
        const headers = ["Workspace", "Total Runs", "Passed", "Failed", "Pass Rate", "Status"];
        const rows = workspaceData.map((w) => [`"${w.name}"`, w.total, w.passed, w.failed, w.passRate + '%', w.status.charAt(0).toUpperCase() + w.status.slice(1)]);
        const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "workspace_performance_report.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleExcludeWorkspaceChange = (e) => {
        const selected = Array.from(e.target.selectedOptions, (option) => option.value);
        setPendingExclusions(selected);
    };

    const applyExclusions = () => {
        setExcludedWorkspaces(pendingExclusions);
    };

    if (loading) {
        return (
            <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ width: '64px', height: '64px', border: '4px solid #2563eb', borderTop: '4px solid transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }}></div>
                    <p style={{ fontSize: '1.25rem', color: '#475569', fontWeight: '500' }}>Loading test statistics...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ backgroundColor: '#fff', borderRadius: '16px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', padding: '32px', maxWidth: '448px', textAlign: 'center' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '16px' }}>⚠️</div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1e293b', marginBottom: '8px' }}>Error Loading Data</h2>
                    <p style={{ color: '#64748b', marginBottom: '24px' }}>{error}</p>
                    <button onClick={fetchData} style={{ backgroundColor: '#2563eb', color: '#fff', padding: '12px 24px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '1rem', fontWeight: '600' }}>Retry</button>
                </div>
            </div>
        );
    }

    if (!data) return null;

    const stats = calculateOverallStats();
    const passRate = stats.totalRuns > 0 ? ((stats.totalPassed / stats.totalRuns) * 100).toFixed(1) : 0;
    const failRate = stats.totalRuns > 0 ? ((stats.totalFailed / stats.totalRuns) * 100).toFixed(1) : 0;

    const workspaceData = data.workspaces.filter((ws) => ws.tests.length > 0 && !excludedWorkspaces.includes(ws.workspaceId)).map((ws) => {
        const wsStats = ws.tests.reduce((acc, test) => ({ passed: acc.passed + test.passed, failed: acc.failed + test.failed, total: acc.total + test.totalRuns }), { passed: 0, failed: 0, total: 0 });
        const passRate = wsStats.total > 0 ? ((wsStats.passed / wsStats.total) * 100).toFixed(1) : 0;
        let status = 'critical';
        if (parseFloat(passRate) >= 90) status = 'excellent';
        else if (parseFloat(passRate) >= 70) status = 'good';
        else if (parseFloat(passRate) >= 50) status = 'attention';
        return { name: ws.workspaceName, id: ws.workspaceId, passed: wsStats.passed, failed: wsStats.failed, total: wsStats.total, passRate: parseFloat(passRate), status };
    }).sort((a, b) => b.total - a.total);

    const statusSummary = {
        excellent: workspaceData.filter(w => w.status === 'excellent').length,
        good: workspaceData.filter(w => w.status === 'good').length,
        attention: workspaceData.filter(w => w.status === 'attention').length,
        critical: workspaceData.filter(w => w.status === 'critical').length,
    };

    const pieData = [
        { name: 'Excellent (≥90%)', value: statusSummary.excellent, color: '#10b981' },
        { name: 'Good (70-89%)', value: statusSummary.good, color: '#3b82f6' },
        { name: 'Needs Attention (50-69%)', value: statusSummary.attention, color: '#f59e0b' },
        { name: 'Critical (<50%)', value: statusSummary.critical, color: '#ef4444' },
    ].filter(item => item.value > 0);

    const overallStatus = parseFloat(passRate) >= 90 ? 'excellent' : parseFloat(passRate) >= 70 ? 'good' : parseFloat(passRate) >= 50 ? 'attention' : 'critical';

    return (
        <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #f8fafc 100%)', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
            <style>{`
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                .hover-shadow:hover { box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1); transform: translateY(-2px); }
                .expandable-row { cursor: pointer; transition: background-color 0.2s; }
                .expandable-row:hover { background-color: #f1f5f9; }
            `}</style>

            <div style={{ backgroundColor: '#fff', borderBottom: '1px solid #e2e8f0', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)' }}>
                <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px 32px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
                        <div>
                            <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1e293b', marginBottom: '4px' }}>Management Performance Dashboard</h1>
                            <p style={{ color: '#64748b', fontSize: '0.875rem' }}>Comprehensive test performance analysis and reporting</p>
                        </div>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '0.875rem', color: '#1f2937' }} />
                            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '0.875rem', color: '#1f2937' }} />
                            <button onClick={fetchData} style={{ backgroundColor: '#2563eb', color: '#fff', padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '0.875rem', fontWeight: '600' }}>
                                <Filter style={{ width: '16px', height: '16px', display: 'inline', marginRight: '4px' }} />Apply
                            </button>
                            <button onClick={exportCSV} style={{ backgroundColor: '#10b981', color: '#fff', padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '0.875rem', fontWeight: '600' }}>
                                <Download style={{ width: '16px', height: '16px', display: 'inline', marginRight: '4px' }} />Export CSV
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '32px' }}>
                {/* KPI Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px', marginBottom: '32px' }}>
                    <div className="hover-shadow" style={{ backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', border: '1px solid #e2e8f0', padding: '24px', transition: 'all 0.3s' }}>
                        <div style={{ padding: '12px', backgroundColor: '#dbeafe', borderRadius: '8px', marginBottom: '12px', width: 'fit-content' }}>
                            <Activity style={{ width: '24px', height: '24px', color: '#2563eb' }} />
                        </div>
                        <p style={{ fontSize: '0.75rem', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>Total Test Runs</p>
                        <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1e293b' }}>{stats.totalRuns.toLocaleString()}</p>
                    </div>
                    <div className="hover-shadow" style={{ backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', border: '1px solid #e2e8f0', padding: '24px', transition: 'all 0.3s' }}>
                        <div style={{ padding: '12px', backgroundColor: '#dcfce7', borderRadius: '8px', marginBottom: '12px', width: 'fit-content' }}>
                            <CheckCircle style={{ width: '24px', height: '24px', color: '#059669' }} />
                        </div>
                        <p style={{ fontSize: '0.75rem', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>Passed Tests</p>
                        <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#059669' }}>{stats.totalPassed.toLocaleString()}</p>
                        <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '4px' }}>{passRate}% success</p>
                    </div>
                    <div className="hover-shadow" style={{ backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', border: '1px solid #e2e8f0', padding: '24px', transition: 'all 0.3s' }}>
                        <div style={{ padding: '12px', backgroundColor: '#fee2e2', borderRadius: '8px', marginBottom: '12px', width: 'fit-content' }}>
                            <XCircle style={{ width: '24px', height: '24px', color: '#dc2626' }} />
                        </div>
                        <p style={{ fontSize: '0.75rem', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>Failed Tests</p>
                        <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#dc2626' }}>{stats.totalFailed.toLocaleString()}</p>
                        <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '4px' }}>{failRate}% failure</p>
                    </div>
                    <div className="hover-shadow" style={{ backgroundColor: getStatusBadge(overallStatus).bg, borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', border: `2px solid ${getStatusColor(overallStatus)}`, padding: '24px', transition: 'all 0.3s' }}>
                        <div style={{ padding: '12px', backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: '8px', marginBottom: '12px', width: 'fit-content' }}>
                            {parseFloat(passRate) >= 70 ? <TrendingUp style={{ width: '24px', height: '24px', color: getStatusColor(overallStatus) }} /> : <TrendingDown style={{ width: '24px', height: '24px', color: getStatusColor(overallStatus) }} />}
                        </div>
                        <p style={{ fontSize: '0.75rem', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>Overall Status</p>
                        <p style={{ fontSize: '2rem', fontWeight: 'bold', color: getStatusColor(overallStatus) }}>{passRate}%</p>
                        <p style={{ fontSize: '0.75rem', color: getStatusColor(overallStatus), marginTop: '4px', fontWeight: '600' }}>{getStatusBadge(overallStatus).label}</p>
                    </div>
                </div>

                {/* Status Summary & Pie Chart */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '24px', marginBottom: '32px' }}>
                    <div style={{ backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', border: '1px solid #e2e8f0', padding: '32px' }}>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1e293b', marginBottom: '24px' }}>Workspace Health Overview</h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {[
                                { status: 'excellent', label: 'Excellent', icon: CheckCircle, desc: '≥90% pass rate' },
                                { status: 'good', label: 'Good', icon: TrendingUp, desc: '70-89% pass rate' },
                                { status: 'attention', label: 'Needs Attention', icon: AlertTriangle, desc: '50-69% pass rate' },
                                { status: 'critical', label: 'Critical', icon: XCircle, desc: '<50% pass rate' },
                            ].map(item => {
                                const Icon = item.icon;
                                const badge = getStatusBadge(item.status);
                                const count = statusSummary[item.status];
                                return (
                                    <div key={item.status} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', backgroundColor: badge.bg, borderRadius: '8px', border: `1px solid ${getStatusColor(item.status)}20` }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <Icon style={{ width: '20px', height: '20px', color: getStatusColor(item.status) }} />
                                            <div>
                                                <p style={{ fontSize: '0.875rem', fontWeight: '600', color: badge.color }}>{item.label}</p>
                                                <p style={{ fontSize: '0.75rem', color: '#64748b' }}>{item.desc}</p>
                                            </div>
                                        </div>
                                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: badge.color, minWidth: '40px', textAlign: 'right' }}>{count}</div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                    <div style={{ backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', border: '1px solid #e2e8f0', padding: '32px' }}>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1e293b', marginBottom: '16px', textAlign: 'center' }}>Status Distribution</h2>
                        <ResponsiveContainer width="100%" height={250}>
                            <PieChart>
                                <Pie data={pieData} cx="50%" cy="50%" labelLine={false} label={(entry) => `${entry.name}: ${entry.value}`} outerRadius={80} dataKey="value">
                                    {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Workspace Performance Table with Expandable Rows */}
                <div style={{ backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', border: '1px solid #e2e8f0', overflow: 'hidden', marginBottom: '32px' }}>
                    <div style={{ padding: '24px 32px', borderBottom: '1px solid #e2e8f0' }}>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1e293b', marginBottom: '4px' }}>Workspace Performance Details</h2>
                        <p style={{ fontSize: '0.875rem', color: '#64748b' }}>Click on any workspace to view detailed test results</p>
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                            <tr>
                                <th style={{ padding: '16px 32px', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Workspace</th>
                                <th style={{ padding: '16px 24px', textAlign: 'center', fontSize: '0.75rem', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Total Runs</th>
                                <th style={{ padding: '16px 24px', textAlign: 'center', fontSize: '0.75rem', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Passed</th>
                                <th style={{ padding: '16px 24px', textAlign: 'center', fontSize: '0.75rem', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Failed</th>
                                <th style={{ padding: '16px 24px', textAlign: 'center', fontSize: '0.75rem', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Pass Rate</th>
                                <th style={{ padding: '16px 32px', textAlign: 'center', fontSize: '0.75rem', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Status</th>
                            </tr>
                            </thead>
                            <tbody>
                            {workspaceData.map((ws, index) => {
                                const badge = getStatusBadge(ws.status);
                                const isExpanded = expandedWorkspace === ws.id;
                                const workspace = data.workspaces.find(w => w.workspaceId === ws.id);
                                return (
                                    <React.Fragment key={index}>
                                        <tr className="expandable-row" style={{ borderBottom: isExpanded ? 'none' : '1px solid #f1f5f9' }} onClick={() => toggleWorkspace(ws.id)}>
                                            <td style={{ padding: '16px 32px', fontSize: '0.875rem', fontWeight: '500', color: '#1e293b' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <span style={{ fontSize: '1rem', color: '#64748b', transition: 'transform 0.2s', display: 'inline-block', transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}>▶</span>
                                                    {ws.name}
                                                </div>
                                            </td>
                                            <td style={{ padding: '16px 24px', textAlign: 'center', fontSize: '0.875rem', color: '#64748b', fontWeight: '600' }}>{ws.total.toLocaleString()}</td>
                                            <td style={{ padding: '16px 24px', textAlign: 'center', fontSize: '0.875rem', fontWeight: '600', color: '#059669' }}>{ws.passed.toLocaleString()}</td>
                                            <td style={{ padding: '16px 24px', textAlign: 'center', fontSize: '0.875rem', fontWeight: '600', color: '#dc2626' }}>{ws.failed.toLocaleString()}</td>
                                            <td style={{ padding: '16px 24px', textAlign: 'center', fontSize: '0.875rem', fontWeight: 'bold', color: getStatusColor(ws.status) }}>{ws.passRate}%</td>
                                            <td style={{ padding: '16px 32px', textAlign: 'center' }}>
                                                    <span style={{ display: 'inline-flex', alignItems: 'center', padding: '6px 12px', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: '600', backgroundColor: badge.bg, color: badge.color, gap: '4px' }}>
                                                        {badge.icon} {badge.label}
                                                    </span>
                                            </td>
                                        </tr>
                                        {isExpanded && workspace && workspace.tests.length > 0 && (
                                            <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                <td colSpan="6" style={{ padding: '0', backgroundColor: '#f8fafc' }}>
                                                    <div style={{ padding: '24px 32px' }}>
                                                        <h4 style={{ fontSize: '0.875rem', fontWeight: '600', color: '#64748b', marginBottom: '16px', textTransform: 'uppercase' }}>
                                                            Test Details ({workspace.tests.length} tests)
                                                        </h4>
                                                        <div style={{ display: 'grid', gap: '12px' }}>
                                                            {workspace.tests.map((test, testIndex) => {
                                                                const testStatus = getTestStatus(test.passRate);
                                                                const testBadge = getStatusBadge(testStatus);
                                                                return (
                                                                    <div key={testIndex} style={{ backgroundColor: '#fff', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr', gap: '16px', alignItems: 'center' }}>
                                                                        <div>
                                                                            <p style={{ fontSize: '0.875rem', fontWeight: '600', color: '#1e293b', marginBottom: '2px' }}>{test.scenario}</p>
                                                                            <p style={{ fontSize: '0.75rem', color: '#64748b' }}>{test.project}</p>
                                                                        </div>
                                                                        <div style={{ textAlign: 'center' }}>
                                                                            <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '2px' }}>Failed</p>
                                                                            <p style={{ fontSize: '0.875rem', fontWeight: '600', color: '#dc2626' }}>{test.failed}</p>
                                                                        </div>
                                                                        <div style={{ textAlign: 'center' }}>
                                                                            <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '2px' }}>Pass Rate</p>
                                                                            <p style={{ fontSize: '0.875rem', fontWeight: 'bold', color: getStatusColor(testStatus) }}>{test.passRate}</p>
                                                                        </div>
                                                                        <div style={{ textAlign: 'center' }}>
                                                                                <span style={{ display: 'inline-flex', alignItems: 'center', padding: '4px 10px', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: '600', backgroundColor: testBadge.bg, color: testBadge.color, gap: '4px' }}>
                                                                                    {testBadge.icon} {testBadge.label}
                                                                                </span>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                );
                            })}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Workspace Exclusion Filter */}
                <div style={{ backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', border: '1px solid #e2e8f0', padding: '24px', marginBottom: '32px' }}>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', color: '#1e293b', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Filter style={{ width: '20px', height: '20px' }} />
                        Filter Workspaces
                    </h3>
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                        <div style={{ flex: '1', minWidth: '250px' }}>
                            <label style={{ display: 'block', fontSize: '0.875rem', color: '#64748b', marginBottom: '8px', fontWeight: '500' }}>
                                Select workspaces to exclude from analysis:
                            </label>
                            <select multiple value={pendingExclusions} onChange={handleExcludeWorkspaceChange} style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #d1d5db', backgroundColor: '#fff', fontSize: '0.875rem', color: '#1f2937', height: '120px' }}>
                                {data.workspaces.map((ws) => (
                                    <option key={ws.workspaceId} value={ws.workspaceId}>{ws.workspaceName}</option>
                                ))}
                            </select>
                            <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '8px' }}>Hold Ctrl/Cmd to select multiple workspaces</p>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', minWidth: '200px' }}>
                            <div style={{ padding: '16px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '4px' }}>Selected to exclude:</p>
                                <p style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1e293b' }}>
                                    {pendingExclusions.length} workspace{pendingExclusions.length !== 1 ? 's' : ''}
                                </p>
                            </div>
                            {excludedWorkspaces.length > 0 && (
                                <div style={{ padding: '16px', backgroundColor: '#fef9c3', borderRadius: '8px', border: '1px solid #fde047' }}>
                                    <p style={{ fontSize: '0.75rem', color: '#a16207', marginBottom: '4px' }}>Currently excluded:</p>
                                    <p style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#a16207' }}>
                                        {excludedWorkspaces.length} workspace{excludedWorkspaces.length !== 1 ? 's' : ''}
                                    </p>
                                </div>
                            )}
                            <button onClick={applyExclusions} style={{ backgroundColor: '#2563eb', color: '#fff', padding: '12px 24px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '0.875rem', fontWeight: '600', transition: 'background-color 0.2s' }} onMouseOver={(e) => e.target.style.backgroundColor = '#1d4ed8'} onMouseOut={(e) => e.target.style.backgroundColor = '#2563eb'}>
                                Apply Filter
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TestStatsDashboard;