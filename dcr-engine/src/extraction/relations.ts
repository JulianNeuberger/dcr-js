import type { ProcessDescription, Relation, RelationTypeDefinition } from "./models";
import relationsPrompt from "../prompts/relations";
import { tagMentions } from "./preprocessing";
import { routePrompt } from "./router";

export async function extractRelations(
    model: string,
    doc: ProcessDescription,
    apiKey: string,
    relationDescriptions: RelationTypeDefinition[]
): Promise<Relation[]> {
    const taggedSentences = tagMentions(doc.sentences, doc.mentions);
    const descriptionText = relationDescriptions
        .filter((d) => d.type && d.name && d.description)
        .map((d) => `${d.name}: ${d.description}`)
        .join("\n");

    let prompt = relationsPrompt;
    prompt = prompt.replaceAll("{{text}}", taggedSentences.join('\n'));
    prompt = prompt.replaceAll("{{description}}", descriptionText);

    const result = await routePrompt(prompt, apiKey, model);

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
