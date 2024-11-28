import ANSI from "./utils/ANSI.mjs";
import KeyBoardManager from "./utils/KeyBoardManager.mjs";
import { readMapFile, readRecordFile } from "./utils/fileHelpers.mjs";
import * as CONST from "./constants.mjs";
import { start } from "repl";


const startingLevel = CONST.START_LEVEL_ID;
const levels = loadLevelListings();

let currentLevel = startingLevel;
let levelData = readMapFile(levels[currentLevel]);
let playerPos = { row: null, col: null};

const EMPTY = " ";
const HERO = "H";
const LOOT = "$";
const DOOR = "█";

const THINGS = [LOOT, EMPTY, DOOR];
let eventText = "";

const HP_MAX = 10;
const playerStats = {
    hp: 8,
    chash: 0,
};

let isDirty = true;

let pallet = {
    "█": ANSI.COLOR.LIGHT_GRAY,
    "H": ANSI.COLOR.RED,
    "$": ANSI.COLOR.YELLOW,
    "B": ANSI.COLOR.GREEN,
};

class Labyrinth {

    update() {
        if (playerPos.row == null) {
            for (let row = 0; row < levelData.length; row++) {
                for (let col = 0; col < levelData[row].length; col++) {
                    if (levelData[row][col] === HERO) {
                        playerPos.row = row;
                        playerPos.col = col;
                        break;
                    }
                }
                if (playerPos.row !== null) break;
            }
        }
        

        let drow = 0;
        let dcol = 0;

        if (KeyBoardManager.isUpPressed()) drow = -1;
        else if (KeyBoardManager.isDownPressed()) drow = 1;

        if (KeyBoardManager.isLeftPressed()) dcol = -1;
        else if (KeyBoardManager.isRightPressed()) dcol = 1;

        const tRow = playerPos.row + drow;
        const tCol = playerPos.col + dcol;

        if (THINGS.includes(levelData[tRow][tcol])) {
            const currentItem = levelData[tRow][tcol];

            if (currentItem === LOOT) {
                const LOOT = Math.round(Math.random() * 7) + 3;
                playerStats.chash += LOOT;
                eventText = `Player got ${loot}$`;
            }else if (currentItem === DOOR) {
                this.transitionToLevel("aSharpPlace");
                return;
            }
            
            levelData[playerPos.row][playerPos.col] = EMPTY;
            levelData[tRow][tcol] = HERO;
            playerPos.row = tRow;
            playerPos.col = tcol;

            isDirty = true;
        }
    }

    draw() {

        if (!isDirty) return;
            isDirty = false;

        console.log(ANSI.CLEAR_SCREEN, ANSI.CURSOR_HOME);

        let rendring = this.renderHud();

        for (let row = 0; row < levelData.length; row++) {
            let rowRendering = "";
            for (let col = 0; col < levelData[row].length; col++) {
                const symbol = levelData[row][col];
                rowRendering += pallet[symbol] ? pallet[symbol] + symbol + ANSI.COLOR_RESET : symbol;
            }
            rendring += rowRendering + "\n";
        }

        console.log(rendring);
        if (eventText) {
            console.log(eventText);
            eventText = "";
        }
    }

renderHud() {
    const hpBar = `Life:[${ANSI.COLOR.RED}${this.pad(playerStats.hp, "♥︎")}${ANSI.COLOR_RESET}${ANSI.COLOR.LIGHT_GRAY}${this.pad(HP_MAX - playerStats.hp, "♥︎")}${ANSI.COLOR_RESET}]`;
    const cash = `$:${playerStats.chash}`;
    return `${hpBar} ${cash}\n`;
}

    pad(len, text) {
    return Array(len).fill(text).join("");
}

transitionToLevel(newLevel) {
    currentLevel = newLevel;
    levelData = readMapFile(levels[currentLevel]);
    playerPos.row = null;
    playerPos.col = null;
    console.log(`Transitioned to level: ${newLevel}`);
    isDirty = true;
    }
}

function loadLevelListings(source = CONST.LEVEL_LISTING_FILE) {
    const data = readRecordFile(source);
    const levels = {};
    for (const item of data) {
        const [key, value] = item.split(":");
        if (key && value) {
            levels[key.trim()] = value.trim();
        }
    }
    return levels;
}

export default Labyrinth;