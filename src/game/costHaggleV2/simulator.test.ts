import { Character, Skill } from "./core";
import { simulate } from "./simulator";
import { allSkills } from "./skills";

const skillList = Object.values(allSkills);

class Random {
   x: number;
   y: number;
   z: number;
   w: number;

   constructor(seed = 88675123) {
      this.x = 123456789;
      this.y = 362436069;
      this.z = 521288629;
      this.w = seed;
   }

   // XorShift
   next() {
      let t;

      t = this.x ^ (this.x << 11);
      this.x = this.y;
      this.y = this.z;
      this.z = this.w;
      return (this.w = this.w ^ (this.w >>> 19) ^ (t ^ (t >>> 8)));
   }

   signedNext() {
      return Math.abs(this.next());
   }
}

function makeRandomCharacter(): Character {
   const seed = Date.now();
   const random = new Random(seed);
   const s = (random.signedNext() % 5) + 1;
   const a = random.signedNext() % (10 - s + 1);
   const d = 10 - s - a;
   const skills = [];
   for (let i = 0; i < 10; i++) {
      skills.push(skillList[random.signedNext() % skillList.length]);
   }
   return {
      name: "" + seed,
      a,
      b: 20,
      c: 10,
      d,
      s,
      skills,
   };
}

function randomDistribute(
   numPlayer: number,
   skillsPerPlayer: number
): string[][] {
   const random = new Random(Date.now());
   const arr: number[] = [];
   const repeat = Math.ceil(
      (numPlayer * skillsPerPlayer) / (skillList.length - 1)
   );
   for (let i = 0; i < repeat; i++) {
      for (let j = 0; j < skillList.length; j++) {
         if (j != 11) {
            arr.push(j);
         }
      }
   }
   for (let i = 0; i < arr.length; i++) {
      const j = random.signedNext() % (arr.length - i);
      const tmp = arr[i];
      arr[i] = arr[j];
      arr[j] = tmp;
   }
   const ret: string[][] = [];
   for (let i = 0; i < numPlayer; i++) {
      ret.push([]);
      for (let j = 0; j < skillsPerPlayer; j++) {
         ret[i].push(skillList[arr[i * skillsPerPlayer + j]].name);
      }
   }
   return ret;
}

test("random test", () => {
   const p1: Character = {
      name: "P1",
      a: 0,
      b: 20,
      c: 10,
      d: 5,
      s: 5,
      skills: [
         allSkills["毒魔法"],
         allSkills["防御"],
         allSkills["回避"],
         allSkills["回復"],
         allSkills["大防御"],
      ],
   };
   for (let i = 0; i < 1000; i++) {
      const p2 = makeRandomCharacter();
      const { win, log } = simulate(p1, p2);
      if (win < 0) {
         console.log(i, log);
         break;
      }
   }
});

test("simulator test", () => {
   const p1: Character = {
      name: "P1",
      a: 3,
      b: 20,
      c: 10,
      d: 2,
      s: 0,
      skills: [allSkills["攻撃"]],
   };
   const p2: Character = {
      name: "P2",
      a: 2,
      b: 20,
      c: 10,
      d: 10,
      s: 3,
      skills: [allSkills["大魔法"]],
   };
   const { win, log } = simulate(p1, p2);
   console.log(win, log);
});

test("generate test", () => {
   console.log(randomDistribute(7, 10));
});
