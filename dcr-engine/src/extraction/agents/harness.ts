import type { ExtractionConfig, ExtractionResult } from "../models";
import { preprocessText } from "../preprocessing";
import { buildGraph } from "../graph";
import { MentionsAgent } from "./mentionsAgent";
import { EntitiesAgent } from "./entitiesAgent";
import { RelationsAgent } from "./relationsAgent";
import { DataAgent } from "./dataAgent";

export interface ExtractionHarnessOptions {
    includeData?: boolean;
}

export class ExtractionHarness {
    private mentionsAgent: MentionsAgent;
    private entitiesAgent: EntitiesAgent;
    private relationsAgent: RelationsAgent;
    private dataAgent: DataAgent;

    constructor(private config: {
        apiKey: string;
        modelName: string;
    }) {
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
        const includeData = options.includeData !== false;
        const doc = preprocessText(config.text);
        
        onStep?.("Extracting actors and events");
        const mentionsResult = await this.mentionsAgent.run({
            doc,
            apiKey: config.apiKey,
            modelName: config.modelName,
            description: config.mentionDescription,
        });
        doc.mentions = mentionsResult.data;
        
        onStep?.("Resolving entities");
        const entitiesResult = await this.entitiesAgent.run({
            doc,
            apiKey: config.apiKey,
            modelName: config.modelName,
            description: config.entityDescription,
        });
        doc.entities = entitiesResult.data;
        
        onStep?.("Extracting relations");
        const relationsResult = await this.relationsAgent.run({
            doc,
            apiKey: config.apiKey,
            modelName: config.modelName,
            description: config.relationDescription,
        });
        doc.relations = relationsResult.data;
        
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
            mentionDescription: string;
            entityDescription: string;
            relationDescription: string;
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
