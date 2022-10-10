import {
   SkillPool,
   buildSkillPool,
   incBuff,
   incParam,
   merge,
   setParam,
   attack,
   incEnemyDebuff,
   incEnemyParam,
} from "./skillUtils";

export { allSkills };

const allSkills: SkillPool = buildSkillPool([
   {
      name: "茨の鎧",
      stock: 1,
      speed: 1,
      getEffects: incBuff("茨の鎧"),
   },
   {
      name: "反応装甲",
      stock: 1,
      delay: 2,
      speed: 1,
      getEffects: incBuff("反応装甲"),
   },
   {
      name: "即席装甲",
      stock: 1,
      speed: 1,
      getEffects: incBuff("受け流し", () => 5),
   },
   {
      name: "グラスキャノン",
      stock: 1,
      speed: 1,
      getEffects: merge(
         incParam("a", () => 2),
         setParam("d", () => 0)
      ),
   },
   {
      name: "先制攻撃",
      delay: 4,
      speed: 1,
      getEffects: attack({ onSuccess: incEnemyDebuff("スタン") }),
   },
   {
      name: "投擲攻撃",
      stock: 4,
      speed: 1,
      getEffects: attack(),
   },
   {
      name: "緊急回避",
      stock: 2,
      speed: 1,
      getEffects: incBuff("回避"),
   },
   {
      name: "見切り",
      speed: 1,
      getEffects: incBuff("見切り"),
   },
   {
      name: "防御",
      speed: 1,
      getEffects: incBuff("防御"),
   },
   {
      name: "受け流し",
      delay: 2,
      speed: 1,
      getEffects: incBuff("受け流し", () => 4),
   },
   {
      name: "回避",
      delay: 4,
      speed: 1,
      getEffects: incBuff("回避"),
   },
   {
      name: "攻撃",
      getEffects: attack(),
   },
   {
      name: "牽制攻撃",
      delay: 2,
      getEffects: attack({ onSuccess: incBuff("受け流し", () => 2) }),
   },
   {
      name: "致命攻撃",
      delay: 3,
      getEffects: attack({
         powerMult: ({ defender }) => (defender.d == 0 ? 10 : 1),
      }),
   },
   {
      name: "連続攻撃",
      delay: 3,
      getEffects: attack({
         onSuccess: attack({ triggered: true }),
      }),
   },
   {
      name: "燕返し",
      delay: 3,
      getEffects: attack({
         onEvaded: attack({
            triggered: true,
            inevitable: true,
            powerMult: () => 2,
         }),
      }),
   },
   {
      name: "毒攻撃",
      stock: 1,
      getEffects: attack({
         onSuccess: incEnemyDebuff("毒", () => 3),
      }),
   },
   {
      name: "吸血",
      delay: 3,
      getEffects: attack({
         onSuccess: ({ damage, attacker, defender }) =>
            incParam("b", () => damage)({ attacker, defender }),
      }),
   },
   {
      name: "兜割り",
      delay: 3,
      getEffects: attack({
         onSuccess: incEnemyParam("d", () => -1),
      }),
   },
   {
      name: "足払い",
      delay: 2,
      getEffects: attack({
         onSuccess: incEnemyDebuff("スタン"),
      }),
   },
   {
      name: "大防御",
      speed: -1,
      getEffects: incBuff("完全防御"),
   },
   {
      name: "強攻撃",
      speed: -1,
      delay: 3,
      reload: 2,
      getEffects: attack({ powerMult: () => 2 }),
   },
   {
      name: "必殺攻撃",
      speed: -1,
      delay: 6,
      stock: 1,
      getEffects: attack({ powerMult: () => 10 }),
   },
   {
      name: "重攻撃",
      speed: -1,
      getEffects: ({ attacker, defender }) => {
         if (attacker.isSuccessfullyAttackedThisTurn()) {
            return [];
         } else {
            return attack({ powerMult: () => 2 })({ attacker, defender });
         }
      },
   },
   {
      name: "魔法攻撃",
      speed: -1,
      delay: 3,
      getEffects: incEnemyParam("b", ({ attacker }) => -attacker.a),
   },
   {
      name: "毒魔法",
      speed: -1,
      delay: 4,
      getEffects: incEnemyDebuff("毒", () => 2),
   },
   {
      name: "大魔法",
      speed: -1,
      delay: 5,
      reload: 2,
      getEffects: merge(
         incEnemyParam("b", ({ attacker }) => -attacker.a),
         incParam("a", ({ attacker }) => attacker.a)
      ),
   },
   {
      name: "回復",
      speed: -1,
      getEffects: incParam("b", () => 4),
   },
   {
      name: "研磨",
      speed: -1,
      delay: 2,
      getEffects: incParam("a", () => 1),
   },
   {
      name: "補強",
      speed: -1,
      delay: 2,
      getEffects: incParam("d", () => 1),
   },
   {
      name: "加速",
      speed: -1,
      delay: 2,
      getEffects: incParam("s", () => 1),
   },
   {
      name: "茨の森",
      speed: -1,
      delay: 2,
      getEffects: incBuff("茨の鎧", () => 1),
   },
   {
      name: "エンレイジ",
      speed: -1,
      delay: 20,
      getEffects: incEnemyParam("b", () => -9999),
   },
]);
