
import axios from 'axios';

export async function requestAI(read, callback) {

    const API_KEY = '3e3cb091433c48e69c4fe51e69303508';
    const ENDPOINT = 'https://automation-test-dc-headsets.openai.azure.com/openai/deployments/gpt-4o/chat/completions?api-version=2024-02-15-preview';
    let answer 
    const headers = {
        'Content-Type': 'application/json',
        'api-key': API_KEY,
    };

    const payload = {
        messages: read,
        temperature: 0.7,
        top_p: 0.95,
        max_tokens: 800
    };

    try {
        const response = await axios.post(ENDPOINT, payload, { headers });
        answer = response.data.choices[0].message.content;
    }
    catch (error) {
        console.error(`Failed to make the request. Error: ${error}`);
    }
    callback({
        answer : answer
    });
}