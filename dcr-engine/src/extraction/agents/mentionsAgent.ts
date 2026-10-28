import { ExtractionAgent, type AgentContext, type AgentResult } from "./base";
import type { Mention } from "../models";
import mentionPrompt from "../../prompts/mentions";

export interface MentionsAgentInput extends AgentContext {
    description: string;
}

export class MentionsAgent extends ExtractionAgent<MentionsAgentInput, Mention[]> {
    name = "mentions";

    getPrompt(input: MentionsAgentInput): string {
        let text = "";
        let i = 0;
        for (const s of input.doc.sentences) {
            text += `${i}: ${s.trim()}\n`;
            i++;
        }
        let prompt = mentionPrompt;
        prompt = prompt.replaceAll("{{text}}", text);
        prompt = prompt.replaceAll("{{description}}", input.description);
        return prompt;
    }

    prepareInput(input: MentionsAgentInput): MentionsAgentInput {
        return input;
    }

    parseResponse(response: string, input: MentionsAgentInput): Mention[] {
        const mentions: Mention[] = [];
        for (const rawMention of response.trim().split("\n")) {
            if (!rawMention.trim()) continue;
            const parts = rawMention.trim().split("\t");
            if (parts.length < 3) continue;
            const [mentionText, mentionType, mentionSentenceStr] = parts;
            const mentionSentence = Number(mentionSentenceStr);

            if (input.doc.sentences.length <= mentionSentence) {
                console.error(`Ignoring '${mentionText}', references a non existent sentence ${mentionSentence} (${input.doc.sentences.length} sentences in doc).`);
                continue;
            }

            if (input.doc.sentences[mentionSentence].toLowerCase().indexOf(mentionText.toLowerCase()) === -1) {
                console.error(`Ignoring '${mentionText}', which is not in the referenced sentence ${mentionSentence} ('${input.doc.sentences[mentionSentence]}').`);
                continue;
            }

            mentions.push({
                text: mentionText,
                type: mentionType,
                sentence: mentionSentence,
            });
        }
        return mentions;
    }
}
