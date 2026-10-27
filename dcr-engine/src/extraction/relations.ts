import type { ProcessDescription, Relation } from "./models";
import relationsPrompt from "../prompts/relations";
import { callAi, extractOutputText } from "./utils";
import { tagMentions } from "./preprocessing";

export async function extractRelations(model: string, doc: ProcessDescription, apiKey: string, relationDescription: string): Promise<Relation[]> {
    const taggedSentences = tagMentions(doc.sentences, doc.mentions);
    let prompt = relationsPrompt;
    prompt = prompt.replaceAll("{{text}}", taggedSentences.join('\n'));
    prompt = prompt.replaceAll("{{description}}", relationDescription);

    const response = await callAi(apiKey, model, prompt);

    if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();

    const result = extractOutputText(data);

    const relations: Relation[] = [];
    for (const rawRelation of result.trim().split("\n")) {
        const [relationType, head, tail] = rawRelation.split("\t");
        relations.push({
            type: relationType,
            headMentionIndex: Number(head),
            tailMentionIndex: Number(tail),
        });
    }

    return relations;
}
