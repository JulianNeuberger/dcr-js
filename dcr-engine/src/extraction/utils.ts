export function extractOutputText(data: any): string {
    const messageItem = data.output?.find((item: any) => item.type === "message");
    if (!messageItem) {
        throw new Error("No message item found in OpenAI response output");
    }
    return messageItem.content[0].text;
}

export async function callAi(apiKey: string, model: string, prompt: string) {
    return await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model: model,
            input: prompt,
        }),
    });
}
