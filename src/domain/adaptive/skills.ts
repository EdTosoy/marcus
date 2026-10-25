export const skillIds = [
  "recognize-attacks",
  "attack-defense",
  "hanging-pieces",
  "destination-safety",
  "opponent-threats",
] as const;
export type SkillId = (typeof skillIds)[number];
export type Skill = {
  id: SkillId;
  title: string;
  objective: string;
  prerequisites: readonly SkillId[];
};
export const skills: readonly Skill[] = [
  {
    id: "recognize-attacks",
    title: "Recognize attacks",
    objective: "Identify pieces and squares reached by an opponent’s attacks.",
    prerequisites: [],
  },
  {
    id: "attack-defense",
    title: "Attacked and defended",
    objective: "Distinguish an opponent’s attack from a friendly defender.",
    prerequisites: ["recognize-attacks"],
  },
  {
    id: "hanging-pieces",
    title: "Recognize hanging pieces",
    objective:
      "Identify an attacked piece with no defender, without assuming a forced material loss.",
    prerequisites: ["attack-defense"],
  },
  {
    id: "destination-safety",
    title: "Check the destination",
    objective: "Choose a legal destination that the opponent does not attack.",
    prerequisites: ["recognize-attacks"],
  },
  {
    id: "opponent-threats",
    title: "Anticipate the reply",
    objective: "Identify a legal immediate capture after a proposed move.",
    prerequisites: ["hanging-pieces", "destination-safety"],
  },
];
export function assertSkills(catalog: readonly Skill[] = skills): void {
  const ids = new Set(catalog.map((skill) => skill.id));
  if (ids.size !== catalog.length) throw new Error("Duplicate skill ID");
  const visit = (id: SkillId, path: SkillId[]) => {
    if (path.includes(id)) throw new Error("Cyclic skill prerequisites");
    const skill = catalog.find((item) => item.id === id);
    if (!skill || !skill.objective)
      throw new Error("Missing prerequisite or objective");
    skill.prerequisites.forEach((prerequisite) =>
      visit(prerequisite, [...path, id]),
    );
  };
  catalog.forEach((skill) => visit(skill.id, []));
}
