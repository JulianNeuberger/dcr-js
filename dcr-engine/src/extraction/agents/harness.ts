import type { ExtractionConfig, ExtractionResult, MentionTypeDefinition, RelationTypeDefinition } from "../models";
import { preprocessText } from "../preprocessing";
import { buildGraph } from "../graph";
import { MentionsAgent } from "./mentionsAgent";
import { EntitiesAgent } from "./entitiesAgent";
import { RelationsAgent } from "./relationsAgent";
import { DataAgent } from "./dataAgent";

export interface ExtractionHarnessOptions {
    includeData?: boolean;
}

function groupByOrder<T extends { order: number }>(items: T[]): T[][] {
    const sorted = [...items].sort((a, b) => a.order - b.order);
    const groups: T[][] = [];
    let currentGroup: T[] = [];
    let currentOrder: number | null = null;

    for (const item of sorted) {
        if (currentOrder === null || item.order === currentOrder) {
            currentGroup.push(item);
            currentOrder = item.order;
        } else {
            groups.push(currentGroup);
            currentGroup = [item];
            currentOrder = item.order;
        }
    }
    if (currentGroup.length > 0) {
        groups.push(currentGroup);
    }
    return groups;
}

export class ExtractionHarness {
    private mentionsAgent: MentionsAgent;
    private entitiesAgent: EntitiesAgent;
    private relationsAgent: RelationsAgent;
    private dataAgent: DataAgent;

    private config: {
        apiKey: string;
        modelName: string;
    };

    constructor(config: {
        apiKey: string;
        modelName: string;
    }) {
        this.config = config;
        this.mentionsAgent = new MentionsAgent(config);
        this.entitiesAgent = new EntitiesAgent(config);
        this.relationsAgent = new RelationsAgent(config);
        this.dataAgent = new DataAgent(config);
    }

    async extractGraph(
        config: ExtractionConfig,
        onStep?: (step: string) => void,
        options: ExtractionHarnessOptions = {}
    ): Promise<ExtractionResult> {
        const includeData = options.includeData ?? config.includeData ?? true;
        const doc = preprocessText(config.text);

        // --- Mentions: run by order groups ---
        onStep?.("Extracting actors and events");
        const mentionGroups = groupByOrder(config.mentionDescriptions);
        doc.mentions = [];
        for (const group of mentionGroups) {
            const result = await this.mentionsAgent.run({
                doc,
                apiKey: config.apiKey,
                modelName: config.modelName,
                mentionDescriptions: group,
            });
            doc.mentions.push(...result.data);
        }

        // --- Entities ---
        onStep?.("Resolving entities");
        const entitiesResult = await this.entitiesAgent.run({
            doc,
            apiKey: config.apiKey,
            modelName: config.modelName,
            description: config.entityDescription,
        });
        doc.entities = entitiesResult.data;

        // --- Relations: run by order groups ---
        onStep?.("Extracting relations");
        const relationGroups = groupByOrder(config.relationDescriptions);
        doc.relations = [];
        for (const group of relationGroups) {
            const result = await this.relationsAgent.run({
                doc,
                apiKey: config.apiKey,
                modelName: config.modelName,
                relationDescriptions: group,
            });
            doc.relations.push(...result.data);
        }

        if (includeData) {
            onStep?.("Extracting data guards");
            const dataResult = await this.dataAgent.run({
                doc,
                apiKey: config.apiKey,
                modelName: config.modelName,
                description: config.dataDescription,
            });
            doc.variables = dataResult.data.variables;
            doc.expressions = dataResult.data.expressions;
        } else {
            doc.variables = [];
            doc.expressions = [];
        }

        onStep?.("Building DCR graph");
        const graph = buildGraph(doc);

        return {graph, doc};
    }

    async extractFromText(
        text: string,
        descriptions: {
            mentionDescriptions: MentionTypeDefinition[];
            entityDescription: string;
            relationDescriptions: RelationTypeDefinition[];
            dataDescription?: string;
        },
        onStep?: (step: string) => void,
        options: ExtractionHarnessOptions = {}
    ): Promise<ExtractionResult> {
        return this.extractGraph({
            text,
            modelName: this.config.modelName,
            apiKey: this.config.apiKey,
            dataDescription: descriptions.dataDescription || "",
            ...descriptions,
        } as ExtractionConfig, onStep, options);
    }
}

export default function createExtractionHarness(apiKey: string, modelName: string): ExtractionHarness {
    return new ExtractionHarness({ apiKey, modelName });
}
