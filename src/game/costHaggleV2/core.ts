export type {
   Skill,
   SkillContext,
   SkillContextFunction,
   GetSkillEffects,
   Character,
   Output,
   IGameCharacter,
   GameEffect,
   OnAttackSuccessContext,
   OnAttackSuccessContextFunction,
   GetOnAttackSuccessEffects,
   OnAttackEvadedContext,
   OnAttackEvadedContextFunction,
   GetOnAttackEvadedEffects,
};
export { Status };

type Skill = {
   name: string;
   delay?: number;
   stock?: number;
   reload?: number;
   speed?: number; // 1 => 《先制》, -1 =>《後出し》
   getEffects: GetSkillEffects;
};
type SkillContext = {
   attacker: IGameCharacter;
   defender: IGameCharacter;
};
type SkillContextFunction<T> = (context: SkillContext) => T;
type GetSkillEffects = SkillContextFunction<GameEffect[]>;

type Character = {
   name: string;
   a: number;
   b: number;
   c: number;
   d: number;
   s: number;
   skills: Skill[];
};

type Output = {
   win: number; // 1 => P1 Win, 0 => Draw, -1 => P2 Win
   log: string[];
};

interface IGameCharacter {
   id: number;
   a: number;
   b: number;
   c: number;
   d: number;
   s: number;
   isSuccessfullyAttackedThisTurn(): boolean;
}

const Status = [
   "毒",
   "スタン",
   "防御",
   "無防備",
   "完全防御",
   "回避",
   "反射",
   "見切り",
   "受け流し",
   "茨の鎧",
   "反応装甲",
];
type Status = typeof Status[keyof typeof Status];

type GameEffect =
   | {
        type: "Attack";
        attackerId: number;
        targetId: number;
        power: number;
        inevitable?: boolean;
        triggered?: boolean;
        onSuccess?: GetOnAttackSuccessEffects;
        onEvaded?: GetOnAttackEvadedEffects;
     }
   | {
        type: "AddStatus";
        targetId: number;
        statusName: Status;
        amount: number;
     }
   | {
        type: "UpdateParameter";
        targetId: number;
        parameterName: "a" | "b" | "c" | "d" | "s";
        update: (prev: number) => number;
     };
type OnAttackSuccessContext = SkillContext & { damage: number };
type OnAttackSuccessContextFunction<T> = (context: OnAttackSuccessContext) => T;
type GetOnAttackSuccessEffects = OnAttackSuccessContextFunction<GameEffect[]>;
type OnAttackEvadedContext = SkillContext;
type OnAttackEvadedContextFunction<T> = (context: OnAttackEvadedContext) => T;
type GetOnAttackEvadedEffects = OnAttackEvadedContextFunction<GameEffect[]>;
