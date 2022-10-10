import produce from "immer";
import React, { useState } from "react";
import { Output as SimulatorOutput } from "./game/costHaggleV2/core";
import { parseCharacter, simulate } from "./game/costHaggleV2/simulator";

import "./Table.css";

type Position = {
   x: number;
   y: number;
};
type Character = {
   name: string;
   input: string;
};
type Result = Map<string, SimulatorOutput>;

export default function Table() {
   const [characters, setCharacters] = useState<Character[]>([
      { name: "p1", input: "" },
      { name: "p2", input: "" },
      { name: "p3", input: "" },
      { name: "p4", input: "" },
   ]);
   const [result, setResult] = useState<Result>(new Map());
   const [wins, setWins] = useState<number[]>([]);

   const [selectedPos, setSelectedPos] = useState<Position>({ x: 0, y: 0 });

   const addCharacter = () => {
      setCharacters((prev) =>
         produce(prev, (draft) => {
            draft.push({ name: "new character", input: "" });
         })
      );
   };

   const removeCharacter = () => {
      setCharacters((prev) =>
         produce(prev, (draft) => {
            draft.splice(draft.length - 1, 1);
         })
      );
   };

   const simulateAll = () => {
      const newResult: Result = new Map();
      const newWins: number[] = characters.map(() => 0);
      const parsed = characters.map((character) =>
         parseCharacter(character.name, character.input)
      );
      for (let i = 0; i < characters.length; i++) {
         for (let j = i + 1; j < characters.length; j++) {
            const res = simulate(parsed[i], parsed[j]);
            newResult.set(`${i}-${j}`, res);
            newResult.set(`${j}-${i}`, { ...res, win: -res.win });
            if (res.win > 0) {
               newWins[i] += 1;
            } else if (res.win < 0) {
               newWins[j] += 1;
            }
         }
      }
      setResult(newResult);
      setWins(newWins);
      console.log(newResult);
   };

   return (
      <div className="table-root">
         <div className="table">
            <div className="row">
               <div className="cell" />
               {characters.map((character, j) => (
                  <div key={j} className="cell">
                     {character.name}
                  </div>
               ))}
               <div className="cell">Win</div>
            </div>
            {characters.map((_, i) => (
               <div key={i} className="row">
                  <div
                     className="cell"
                     onClick={() => setSelectedPos({ y: i + 1, x: 0 })}
                  >
                     {characters[i].name}
                  </div>
                  {characters.map((_, j) => (
                     <div
                        key={j}
                        className="cell"
                        onClick={() => setSelectedPos({ y: i + 1, x: j + 1 })}
                     >
                        {result.get(`${i}-${j}`)?.win}
                     </div>
                  ))}
                  <div className="cell">{wins[i]}</div>
               </div>
            ))}
            <div className="row">
               <div className="cell" onClick={simulateAll}>
                  Run
               </div>
               <div className="cell" onClick={addCharacter}>
                  Player+
               </div>
               <div className="cell" onClick={removeCharacter}>
                  Player-
               </div>
            </div>
         </div>
         <div className="info">
            {(() => {
               const { x, y } = selectedPos;
               if (y > 0 && x == 0) {
                  const character = characters[y - 1];
                  if (!character) {
                     return null;
                  }
                  return (
                     <div>
                        <div>
                           name:{" "}
                           <input
                              type="text"
                              value={character.name}
                              onChange={(e) =>
                                 setCharacters((prev) =>
                                    produce(prev, (draft) => {
                                       draft[y - 1].name = e.target.value;
                                    })
                                 )
                              }
                           />
                        </div>
                        <textarea
                           className="maxsize"
                           value={character.input}
                           onChange={(e) =>
                              setCharacters((prev) =>
                                 produce(prev, (draft) => {
                                    draft[y - 1].input = e.target.value;
                                 })
                              )
                           }
                        />
                     </div>
                  );
               } else if (y > 0 && x > 0) {
                  const res = result.get(`${y - 1}-${x - 1}`);
                  return <div className="log">{res?.log.join("\n")}</div>;
               } else {
                  return null;
               }
            })()}
         </div>
      </div>
   );
}
