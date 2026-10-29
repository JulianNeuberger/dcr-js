import type { MentionTypeDefinition, RelationTypeDefinition } from "./models";

export const defaultMentionDescriptions: MentionTypeDefinition[] = [
    {
        type: "Event",
        name: "Event",
        description:
            "Definition of an event, occurrence, or circumstance that is " +
            "relevant to the regulation or law.",
        order: 1,
    },
    {
        type: "Event",
        name: "Obligation",
        description:
            "An obligation that is the result of some event that happened " +
            "previously.",
        order: 1,
    },
    {
        type: "Event",
        name: "Permission",
        description:
            "A permission that is the result of some event that happened " +
            "previously.",
        order: 1,
    },
    {
        type: "Event",
        name: "Exception",
        description:
            "Definition of conditions that constitute an exception " +
            "to the applicability of other obligations or permissions.",
        order: 1,
    },
    {
        type: "Actor",
        name: "Actor",
        description:
            "Nouns and pronouns, that describe a person, system, or company " +
            "that plays an active role in the scenario of the regulation, law.",
        order: 2,
    },
];

export const defaultRelationDescriptions: RelationTypeDefinition[] = [
    {
        type: "executes",
        name: "executes",
        description:
            "Focus on actors. Extract a relation of type 'executes', if the text describes that this actor (head) " +
            "is responsible for the event (tail).",
        order: 1,
    },
    {
        type: "condition",
        name: "condition",
        description:
            "Focus on events. Extract a relation of type 'condition', if one event (head) must be executed before " +
            "another (tail) event can be executed (first event is the 'condition' for the second event).",
        order: 2,
    },
    {
        type: "response",
        name: "response",
        description:
            "Focus on events. Extract a relation of type 'response', if executing one event (head) necessitates the " +
            "execution of another (tail) event ('responding' to the first event).",
        order: 3,
    },
    {
        type: "includes",
        name: "includes",
        description:
            "Focus on events. Extract a relation of type 'includes', if executing one event (head) enables the " +
            "execution of another (tail) event again, even if it was excluded before.",
        order: 4,
    },
    {
        type: "excludes",
        name: "excludes",
        description:
            "Focus on events. Extract a relation of type 'excludes', if executing one event (head) makes executing " +
            "another (tail) event impossible, i.e., prevents its execution. Excludes relations can be reflexive, " +
            "e.g., if one event can only be executed once.",
        order: 5,
    },
];

export const defaultEntityDescription: string =
    "**Entity**: A real-world object that can be referred to by multiple mentions, e.g., a person, company, or event. " +
    "Mentions contained in the same entity must refer to the same real-world object.";

export const defaultDataDescription: string =
    "**Variable**: Data that is relevant to the process, e.g., by changing rules or outcomes. Examples are the age of " +
    "process participants, distances, weights, number of units, etc. Time does not need to be extracted separately and " +
    "will always be a variable available by default.\n" +
    "**Expression**: Rules that change behaviour and constraints, e.g., if a response is only valid if some variable is " +
    "below a certain threshold. Such expressions are called Guards. If the expression uses the time variable, they are " +
    "called Deadlines (for responses) and Timeouts (for conditions). Expressions always shall be extracted in the FEEL " +
    "notation, deadlines and timeouts use the time period format, e.g., PT2h for a period of 2 hours.";

export const initGraphName: string = "DCR-JS Graph";
