const API_BASE = '/api';
export async function getDataStatus() {
    const res = await fetch(`${API_BASE}/data/status`);
    return res.json();
}
export async function updateData(params) {
    const res = await fetch(`${API_BASE}/data/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
    });
    return res.json();
}
export async function getJobs(limit = 50) {
    const res = await fetch(`${API_BASE}/data/jobs?limit=${limit}`);
    return res.json();
}
export async function getQualityChecks(limit = 50) {
    const res = await fetch(`${API_BASE}/data/quality?limit=${limit}`);
    return res.json();
}
