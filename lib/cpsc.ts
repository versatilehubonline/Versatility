
const BASE_URL = "https://www.saferproducts.gov/RestWebServices/Recall";

export interface CPSCRecall {
    RecallID: number;
    RecallNumber: string;
    RecallDate: string;
    Description: string;
    URL: string;
    Title: string;
    ConsumerContact: string;
    Images: { URL: string }[];
    Products: { Name: string }[];
}

export async function searchCPSCRecalls(keyword: string): Promise<CPSCRecall[]> {
    try {
        // The CPSC API allows searching by keyword in the Description or Title
        // Format: ?format=json&RecallTitle={keyword}
        // We'll search primarily by Title as it's more relevant for product matches
        const response = await fetch(`${BASE_URL}?format=json&RecallTitle=${encodeURIComponent(keyword)}`, {
            headers: {
                "User-Agent": "ReliabilityChecker/1.0 (Educational Project; +http://localhost:3000)"
            }
        });

        if (!response.ok) {
            console.warn(`CPSC API returned ${response.status}`);
            return [];
        }

        const data = await response.json();
        return data as CPSCRecall[];
    } catch (error) {
        console.error("Failed to fetch from CPSC API:", error);
        return [];
    }
}
