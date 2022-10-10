import {
   GameEffect,
   GetOnAttackEvadedEffects,
   GetOnAttackSuccessEffects,
   GetSkillEffects,
   IGameCharacter,
   Skill,
   SkillContext,
   SkillContextFunction,
   Status,
} from "./core";

export type { SkillPool };
export {
   buildSkillPool,
   merge,
   incBuff,
   incEnemyDebuff,
   incParam,
   setParam,
   incEnemyParam,
   attack,
};

type SkillPool = { [name: string]: Skill };
function buildSkillPool(skills: Skill[]): SkillPool {
   return skills.reduce((ret: SkillPool, skill) => {
      ret[skill.name] = skill;
      return ret;
   }, {});
}

function merge(...getEffects: GetSkillEffects[]): GetSkillEffects {
   return (env) => getEffects.map((f) => f(env)).flat();
}

function incBuff(
   statusName: Status,
   amount: SkillContextFunction<number> = () => 1
): GetSkillEffects {
   return (context) => [
      {
         type: "AddStatus",
         targetId: context.attacker.id,
         statusName,
         amount: amount(context),
      },
   ];
}

function incEnemyDebuff(
   statusName: Status,
   amount: SkillContextFunction<number> = () => 1
): GetSkillEffects {
   return (context) => [
      {
         type: "AddStatus",
         targetId: context.defender.id,
         statusName,
         amount: amount(context),
      },
   ];
}

function incParam(
   parameterName: "a" | "b" | "c" | "d" | "s",
   amount: SkillContextFunction<number> = () => 1
): GetSkillEffects {
   return (context) => [
      {
         type: "UpdateParameter",
         targetId: context.attacker.id,
         parameterName,
         update: (x) => x + amount(context),
      },
   ];
}

function setParam(
   parameterName: "a" | "b" | "c" | "d" | "s",
   amount: SkillContextFunction<number> = () => 1
): GetSkillEffects {
   return (context) => [
      {
         type: "UpdateParameter",
         targetId: context.attacker.id,
         parameterName,
         update: () => amount(context),
      },
   ];
}

function incEnemyParam(
   parameterName: "a" | "b" | "c" | "d" | "s",
   amount: SkillContextFunction<number> = () => 1
): GetSkillEffects {
   return (context) => [
      {
         type: "UpdateParameter",
         targetId: context.defender.id,
         parameterName,
         update: (x) => x + amount(context),
      },
   ];
}

function attack(options?: {
   powerMult?: (params: {
      attacker: IGameCharacter;
      defender: IGameCharacter;
   }) => number;
   onSuccess?: GetOnAttackSuccessEffects;
   onEvaded?: GetOnAttackEvadedEffects;
   triggered?: boolean;
   inevitable?: boolean;
}): GetSkillEffects {
   return ({ attacker, defender }) => {
      const effect: GameEffect = {
         type: "Attack",
         attackerId: attacker.id,
         targetId: defender.id,
         power: attacker.a,
      };
      if (options && options.powerMult) {
         effect.power *= options.powerMult({ attacker, defender });
      }
      if (options && options.onSuccess) {
         effect.onSuccess = options.onSuccess;
      }
      if (options && options.onEvaded) {
         effect.onEvaded = options.onEvaded;
      }
      if (options && options.triggered) {
         effect.triggered = options.triggered;
      }
      if (options && options.inevitable) {
         effect.inevitable = options.inevitable;
      }
      return [effect];
   };
}
