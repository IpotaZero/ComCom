"use strict";
// src/utils/loadMidi.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadMidi = loadMidi;
const fs_1 = __importDefault(require("fs"));
const MidiParser = require("midi-parser-js");
function loadMidi(filePath) {
    if (!fs_1.default.existsSync(filePath)) {
        throw new Error(`MIDI file not found: ${filePath}`);
    }
    const buffer = fs_1.default.readFileSync(filePath);
    const base64 = buffer.toString("base64");
    let parsedMidi;
    try {
        parsedMidi = MidiParser.parse(base64);
    }
    catch (err) {
        throw new Error(`Failed to parse MIDI file: ${err}`);
    }
    return parsedMidi;
}
