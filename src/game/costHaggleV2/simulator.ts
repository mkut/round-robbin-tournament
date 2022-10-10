import {
   Character,
   GameEffect,
   IGameCharacter,
   Output,
   Skill,
   Status,
} from "./core";
import { allSkills } from "./skills";

export { simulate, parseCharacter };
type GameStatus = Map<Status, number>;

class GameState {
   characters: [GameCharacter, GameCharacter];
   turn: number;
   log: string[];

   constructor(p1: Character, p2: Character) {
      this.characters = [new GameCharacter(p1), new GameCharacter(p2)];
      this.turn = 0;
      this.log = [];
   }

   apply(effect: GameEffect) {
      switch (effect.type) {
         case "Attack": {
            const attacker = this.getCharacterById(effect.attackerId);
            const defender = this.getCharacterById(effect.targetId);

            // 『回避』
            if (defender.getStatus("回避") > 0) {
               defender.updateStatus("回避", (x) => x - 1);
               this.addLog("回避");

               // 誘発チェック
               if (effect.onEvaded && !effect.triggered) {
                  for (const triggered of effect.onEvaded({
                     attacker,
                     defender: defender,
                  })) {
                     this.apply(triggered);
                  }
               }
               return;
            }

            // 『防御』『無防備』
            const d =
               defender.d *
               Math.max(
                  0,
                  1 + defender.getStatus("防御") - defender.getStatus("無防備")
               );

            let damage = Math.max(0, effect.power - d);

            // 『完全防御』
            if (defender.getStatus("完全防御") > 0) {
               damage *= 0;
            }

            // 『受け流し』
            const prevented = Math.min(damage, defender.getStatus("受け流し"));
            if (prevented > 0) {
               defender.updateStatus("受け流し", (x) => x - prevented);
               damage -= prevented;
               this.addLog(`受け流し: ${prevented} 軽減`);
            }

            // HP減少処理
            defender.b -= damage;
            this.addLog(`${damage} ダメージ`);

            if (damage > 0) {
               defender.successfullyAttackedThisTurn = true;
            }

            // 『茨の鎧』
            if (defender.getStatus("茨の鎧") > 0) {
               attacker.b -= defender.getStatus("茨の鎧");
               this.addLog(`茨の鎧: ${defender.getStatus("茨の鎧")} ダメージ`);
            }

            // 『反応装甲』
            if (damage > 0 && defender.getStatus("反応装甲") > 0) {
               defender.d += defender.getStatus("反応装甲");
               this.addLog(`反応装甲: 【D】+${defender.getStatus("反応装甲")}`);
            }

            // 『見切り』
            if (defender.getStatus("見切り") > 0) {
               defender.updateStatus("回避", (x) => x + 1);
               defender.updateStatus("見切り", (x) => x - 1);
               this.addLog(`見切り: 『回避』+1`);
            }

            // 誘発チェック
            if (effect.onSuccess && damage > 0 && !effect.triggered) {
               for (const triggered of effect.onSuccess({
                  attacker,
                  defender: defender,
                  damage,
               })) {
                  this.apply(triggered);
               }
            }

            return;
         }
         case "AddStatus": {
            const target = this.getCharacterById(effect.targetId);
            const current = target.getStatus(effect.statusName);
            target.status.set(effect.statusName, current + effect.amount);
            this.addLog(
               `『${effect.statusName}』${effect.amount < 0 ? "" : "+"}${
                  effect.amount
               }`
            );
            return;
         }
         case "UpdateParameter": {
            const target = this.getCharacterById(effect.targetId);
            const current = target[effect.parameterName];
            let next = effect.update(current);
            if (effect.parameterName == "b") {
               next = Math.min(next, target.original.b);
            }
            target[effect.parameterName] = next;
            this.addLog(
               `【${effect.parameterName.toUpperCase()}】${current}→${next}`
            );
            return;
         }
      }
   }

   getCharacterById(id: number): GameCharacter {
      const maybe = this.characters.find((character) => character.id == id);
      if (maybe == undefined) {
         throw new Error(`Unknown character id: ${id}`);
      }
      return maybe;
   }

   getEnemyCharacterById(id: number): GameCharacter {
      const enemies = this.characters.filter((character) => character.id != id);
      if (enemies.length != 1) {
         throw new Error(`Unknown character id: ${id}`);
      }
      return enemies[0];
   }

   getActiveSkills(): { skill: GameSkill; attacker: GameCharacter }[] {
      return this.characters
         .map((character) =>
            character
               .getActiveSkills(this.turn)
               .map((skill) => ({ skill, attacker: character }))
         )
         .flat()
         .sort((a, b) => {
            const skillSpeedA = a.skill.original.speed || 0;
            const skillSpeedB = b.skill.original.speed || 0;
            const speedA = a.attacker.s;
            const speedB = b.attacker.s;
            const idA = a.attacker.id;
            const idB = b.attacker.id;
            if (skillSpeedA != skillSpeedB) {
               return skillSpeedB - skillSpeedA;
            }
            if (speedA != speedB) {
               return speedB - speedA;
            }
            if (idA != idB) {
               return idA - idB;
            }
            return 0;
         });
   }

   gameEndCheck(): number | null {
      let win: number | null = null;
      if (this.characters.some((character) => character.b <= 0)) {
         if (this.characters[0].b <= 0 && this.characters[1].b <= 0) {
            if (this.characters[0].b >= this.characters[1].b) {
               win = 1;
            } else {
               win = -1;
            }
         } else if (this.characters[0].b <= 0) {
            win = -1;
         } else {
            win = 1;
         }
         const winner =
            win > 0
               ? this.characters[0].original.name
               : this.characters[1].original.name;
         this.addLog(`========== 決着 ==========`);
         this.addLog(this.characters[0].toString());
         this.addLog(this.characters[1].toString());
         this.addLog(`${winner} Win`);
      }
      return win;
   }

   addLog(message: string): void {
      this.log.push(message);
   }
}

class GameSkill {
   original: Skill;
   used: number;
   previousUsed: number | null;

   constructor(original: Skill) {
      this.original = original;
      this.used = 0;
      this.previousUsed = null;
   }

   isAvailable(turn: number): boolean {
      // 《遅延X》
      if (this.original.delay != undefined && this.original.delay > turn) {
         return false;
      }

      // 《在庫X》
      if (
         this.original.stock != undefined &&
         this.original.stock <= this.used
      ) {
         return false;
      }

      // 《装填X》
      if (
         this.original.reload != undefined &&
         this.previousUsed != null &&
         this.previousUsed + this.original.reload > turn
      ) {
         return false;
      }

      return true;
   }
}

class GameCharacter implements IGameCharacter {
   static idMax = 0;
   original: Character;
   id: number;
   a: number;
   b: number;
   c: number;
   d: number;
   s: number;
   skills: GameSkill[];
   status: GameStatus;
   successfullyAttackedThisTurn: boolean;

   constructor(original: Character) {
      this.original = original;
      this.id = GameCharacter.idMax++;
      this.a = original.a;
      this.b = original.b;
      this.c = original.c;
      this.d = original.d;
      this.s = original.s;
      this.skills = original.skills.map((skill) => new GameSkill(skill));
      this.status = new Map<Status, number>();
      this.successfullyAttackedThisTurn = false;
   }

   isSuccessfullyAttackedThisTurn(): boolean {
      return this.successfullyAttackedThisTurn;
   }

   getActiveSkills(turn: number): GameSkill[] {
      return this.skills
         .filter((skill) => skill.isAvailable(turn))
         .slice(0, this.s);
   }

   getStatus(status: Status): number {
      return this.status.get(status) || 0;
   }

   updateStatus(status: Status, update: (prev: number) => number): void {
      this.status.set(status, update(this.getStatus(status)));
   }

   toString(): string {
      let ret = `${this.original.name} HP: ${this.b}/${this.original.b} A: ${this.a} D: ${this.d} S: ${this.s}`;
      this.status.forEach((value, key) => {
         if (value != 0) {
            ret += ` ${key}${value}`;
         }
      });
      return ret;
   }
}

function simulate(p1: Character, p2: Character): Output {
   const gameState: GameState = new GameState(p1, p2);

   let win: number | null = null;
   while (win == null && gameState.turn < 20) {
      gameState.turn += 1;
      gameState.addLog(`========== turn ${gameState.turn} ==========`);
      gameState.addLog(gameState.characters[0].toString());
      gameState.addLog(gameState.characters[1].toString());
      win = gameState.gameEndCheck();
      if (win != null) {
         break;
      }
      const activeSkills = gameState.getActiveSkills();
      for (const { skill, attacker } of activeSkills) {
         // 『スタン』
         if (attacker.getStatus("スタン") > 0) {
            attacker.updateStatus("スタン", (x) => x - 1);
            gameState.addLog(
               `${attacker.original.name}: 『スタン』により行動中止： ${skill.original.name}`
            );
            continue;
         }

         const effects = skill.original.getEffects({
            attacker,
            defender: gameState.getEnemyCharacterById(attacker.id),
         });
         skill.previousUsed = gameState.turn;
         skill.used += 1;
         gameState.addLog(`${attacker.original.name}: ${skill.original.name}`);
         for (const effect of effects) {
            gameState.apply(effect);
         }
         win = gameState.gameEndCheck();
         if (win != null) {
            break;
         }
      }
      for (const character of gameState.characters) {
         if (character.getStatus("毒") > 0) {
            character.b -= character.getStatus("毒");
            gameState.addLog(`毒: ${character.getStatus("毒")} ダメージ`);
            character.updateStatus("毒", (x) => x - 1);
         }
         character.updateStatus("スタン", () => 0);
         character.updateStatus("防御", () => 0);
         character.updateStatus("無防備", () => 0);
         character.updateStatus("完全防御", () => 0);
         character.updateStatus("回避", () => 0);
         character.updateStatus("反射", () => 0);
         character.updateStatus("見切り", () => 0);
         character.successfullyAttackedThisTurn = false;
      }
   }

   return {
      win: win || 0,
      log: gameState.log,
   };
}

function parseCharacter(name: string, text: string): Character {
   const lines = text.split("\n");
   const character: Character = {
      name,
      a: 0,
      b: 0,
      c: 10,
      d: 0,
      s: 0,
      skills: [],
   };
   for (const line of lines) {
      let rr;
      if (line == "") {
         // can be empty line
      } else if ((rr = /⓪無償パーツBx(\d+)/.exec(line))) {
         character.b += Number(rr[1]);
      } else if ((rr = /①基本パーツAx(\d+)/.exec(line))) {
         character.a += Number(rr[1]);
         character.c -= Number(rr[1]);
      } else if ((rr = /①基本パーツBx(\d+)/.exec(line))) {
         character.b += Number(rr[1]) * 5;
         character.c -= Number(rr[1]);
      } else if ((rr = /①基本パーツDx(\d+)/.exec(line))) {
         character.d += Number(rr[1]);
         character.c -= Number(rr[1]);
      } else if ((rr = /①基本パーツSx(\d+)/.exec(line))) {
         character.s += Number(rr[1]);
         character.c -= Number(rr[1]);
      } else if (allSkills[line]) {
         character.skills.push(allSkills[line]);
      } else {
         throw new Error("Unknown line: " + line);
      }
   }
   return character;
}
