
const BASE_URL = "https://api.fda.gov";

export interface FDAEnforcementReport {
    recall_number: string;
    reason_for_recall: string;
    status: string;
    distribution_pattern: string;
    product_description: string;
    recalling_firm: string;
    report_date: string;
}

export async function searchFDARecalls(keyword: string): Promise<FDAEnforcementReport[]> {
    // Query multiple openFDA endpoints: drug, device, food
    const endpoints = [
        `${BASE_URL}/drug/enforcement.json`,
        `${BASE_URL}/device/enforcement.json`,
        `${BASE_URL}/food/enforcement.json`
    ];

    try {
        const promises = endpoints.map(endpoint =>
            fetch(`${endpoint}?search=product_description:"${encodeURIComponent(keyword)}"&limit=1`)
                .then(res => {
                    if (!res.ok) return null;
                    return res.json();
                })
                .catch(() => null)
        );

        const results = await Promise.all(promises);
        const recalls: FDAEnforcementReport[] = [];

        results.forEach(data => {
            if (data && data.results && data.results.length > 0) {
                recalls.push(...data.results);
            }
        });

        return recalls;
    } catch (error) {
        console.error("FDA API Error:", error);
        return [];
    }
}
