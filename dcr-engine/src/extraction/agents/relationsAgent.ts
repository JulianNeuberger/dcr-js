import { ExtractionAgent, type AgentContext } from "./base";
import type { Relation, RelationTypeDefinition } from "../models";
import relationsPrompt from "../../prompts/relations";
import { tagMentions } from "../preprocessing";

export interface RelationsAgentInput extends AgentContext {
    relationDescriptions: RelationTypeDefinition[];
}

export class RelationsAgent extends ExtractionAgent<RelationsAgentInput, Relation[]> {
    name = "relations";

    getPrompt(input: RelationsAgentInput): string {
        const taggedSentences = tagMentions(input.doc.sentences, input.doc.mentions);
        const descriptionText = input.relationDescriptions
            .filter((d) => d.type && d.name && d.description)
            .map((d) => `${d.name}: ${d.description}`)
            .join("\n");

        let prompt = relationsPrompt;
        prompt = prompt.replaceAll("{{text}}", taggedSentences.join('\n'));
        prompt = prompt.replaceAll("{{description}}", descriptionText);
        return prompt;
    }

    prepareInput(input: RelationsAgentInput): RelationsAgentInput {
        return input;
    }

    parseResponse(response: string): Relation[] {
        const relations: Relation[] = [];
        for (const rawRelation of response.trim().split("\n")) {
            if (!rawRelation.trim()) continue;
            const parts = rawRelation.split("\t");
            if (parts.length < 3) continue;
            const [relationType, head, tail] = parts;
            relations.push({
                type: relationType,
                headMentionIndex: Number(head),
                tailMentionIndex: Number(tail),
            });
        }
        return relations;
    }
}
