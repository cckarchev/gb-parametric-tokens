import { PlaybookData } from "./types";

const DATA_URL =
  "https://raw.githubusercontent.com/cleech/GBPlaybook/refs/heads/pwa/public/data/GB-Playbook-4-8.json";

export async function getData(): Promise<PlaybookData> {
  const response = await fetch(DATA_URL);
  if (!response.ok) {
    throw new Error(`Failed to fetch data: ${response.statusText}`);
  }
  return response.json();
}
