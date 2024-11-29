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
const DOOR = "1";
const TELEPORT_SYMBOL = "T";

const THINGS = [LOOT, EMPTY, DOOR, "2", "0"];
let eventText = "";

const HP_MAX = 10;
const playerStats = {
    hp: 8,
    cash: 0,
};

let isDirty = true;

let pallet = {
    "█": ANSI.COLOR.LIGHT_GRAY,
    "H": ANSI.COLOR.RED,
    "$": ANSI.COLOR.YELLOW,
    "B": ANSI.COLOR.GREEN,
};


const DOORS = {
    "1": "aSharpPlace",
    "2": "level3",
    "0": "start"
};

function findTeleportLocations(levelData) {
    const teleportLocations = [];
    for (let row = 0; row < levelData.length; row++) {
        for (let col = 0; col < levelData[row].length; col++) {
            if (levelData[row][col] === TELEPORT_SYMBOL) {
                teleportLocations.push({ row, col });
            }

        }
    }
    return teleportLocations;
}

function handleTeleport(playerPos, teleportLocations) {
    
    if (teleportLocations.length === 2) {
        const [location1, location2] = teleportLocations;

        const target = (playerPos.row === location1.row && playerPos.col === location1.col)
        ? location2
        : location1;

        levelData[playerPos.row][playerPos.col] = EMPTY;
        levelData[target.row][target.col] = HERO;

        playerPos.row = target.row;
        playerPos.col = target.col;

        eventText = "You teleported!";
        isDirty = true;
    } else {
        console.log("Teleport failed!");
    }
}

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
        

        let dRow = 0;
        let dCol = 0;

        if (KeyBoardManager.isUpPressed()) dRow = -1;
        else if (KeyBoardManager.isDownPressed()) dRow = 1;

        if (KeyBoardManager.isLeftPressed()) dCol = -1;
        else if (KeyBoardManager.isRightPressed()) dCol = 1;

        const tRow = playerPos.row + dRow;
        const tCol = playerPos.col + dCol;

        if (tRow >= 0 && tRow < levelData.length && tCol >= 0 && tCol < levelData[tRow].length) {
            const currentItem = levelData[tRow][tCol];

            if (currentItem === TELEPORT_SYMBOL) {
                const teleportLocations = findTeleportLocations(levelData);
                handleTeleport(playerPos, teleportLocations);
                return;
            }
        }

        if (THINGS.includes(levelData[tRow][tCol])) {
            const currentItem = levelData[tRow][tCol];

            if (currentItem === LOOT) {
                const LOOT_AMOUNT = Math.round(Math.random() * 7) + 3;
                playerStats.cash += LOOT_AMOUNT;
                eventText = `Player got ${LOOT_AMOUNT}$`;
            }
            else if (currentItem in DOORS) {
                this.transitionToLevel(DOORS[currentItem]);
                return;
            }
            
            levelData[playerPos.row][playerPos.col] = EMPTY;
            levelData[tRow][tCol] = HERO;
            playerPos.row = tRow;
            playerPos.col = tCol;

            isDirty = true;
        }
    }

    draw() {

        if (!isDirty) return;
            isDirty = false;

        console.log(ANSI.CLEAR_SCREEN, ANSI.CURSOR_HOME);

        let rendering = this.renderHud();

        for (let row = 0; row < levelData.length; row++) {
            let rowRendering = "";
            for (let col = 0; col < levelData[row].length; col++) {
                const symbol = levelData[row][col];
                rowRendering += pallet[symbol] ? pallet[symbol] + symbol + ANSI.COLOR_RESET : symbol;
            }
            rendering += rowRendering + "\n";
        }

        console.log(rendering);
        if (eventText) {
            console.log(eventText);
            eventText = "";
        }
    }

renderHud() {
    const hpBar = `Life:[${ANSI.COLOR.RED}${this.pad(playerStats.hp, "♥︎")}${ANSI.COLOR_RESET}${ANSI.COLOR.LIGHT_GRAY}${this.pad(HP_MAX - playerStats.hp, "♥︎")}${ANSI.COLOR_RESET}]`;
    const cash = `$:${playerStats.cash}`;
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