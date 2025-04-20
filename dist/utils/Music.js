"use strict";
// midiを捨象したデータ
class Music {
    isReady;
    tracks = [];
    constructor(midi) {
        this.isReady = (async () => {
            this.tracks = await MidiFormatter.formatMidi(midi);
        })();
    }
    displayTo(screen) {
        const pianoRollWidth = (~~(this.#getLength() / (480 * 4)) + 1) * (480 * 4);
        screen.style.width = `calc(${pianoRollWidth} * var(--width))`;
        const lines = document.createElement("div");
        lines.classList.add("lines");
        this.#drawLines(lines, pianoRollWidth);
        screen.appendChild(lines);
        this.tracks.forEach((track, i) => {
            const trackDiv = document.createElement("div");
            trackDiv.classList.add("track");
            trackDiv.id = "track-" + i;
            // trackDiv.style.filter = `hue-rotate(${400 * (i / 17)}deg)`
            screen.appendChild(trackDiv);
            track.displayTo(trackDiv, i === 11 ? "rhythm" : "melody");
        });
    }
    #drawLines(screen, width) {
        for (let x = 240; x < width; x += 480 * 4) {
            const barLine = document.createElement("span");
            barLine.classList.add("bar-line");
            barLine.style.left = `calc(${x} * var(--width))`;
            screen.appendChild(barLine);
            for (let i = 0; i < 3; i++) {
                const beatLine = document.createElement("span");
                beatLine.classList.add("beat-line");
                beatLine.style.left = `calc(${x + 480 * (i + 1)} * var(--width))`;
                screen.appendChild(beatLine);
            }
        }
    }
    #getLength() {
        return Math.max(...this.tracks.map((track) => track.getLength()));
    }
}
// ダイアトニック
// 0,2,4,5,7,9,11
class Track {
    notes;
    constructor(notes) {
        this.notes = notes;
    }
    displayTo(screen, type = "melody") {
        this.notes.forEach((note) => {
            const elm = note.getElement(type);
            screen.appendChild(elm);
        });
    }
    displayWithAnalyze(screen, chordTrack) {
        for (let i = 0; i < this.notes.length; i++) {
            const harmonicType = this.#getHarmonicType(this.notes[i - 1] ?? null, this.notes[i], this.notes[i + 1] ?? null, chordTrack);
            const elm = this.notes[i].getElement();
            elm.classList.add(harmonicType);
            screen.appendChild(elm);
        }
    }
    #getHarmonicType(preNote, currentNote, nextNote, chordTrack) {
        // 和声音
        if (chordTrack.#includes(currentNote)) {
            return "harmonic";
        }
        if (preNote && nextNote && chordTrack.#includes(preNote) && chordTrack.#includes(nextNote)) {
            // 経過音
            if ((preNote.pitch < currentNote.pitch && currentNote.pitch < nextNote.pitch) ||
                (preNote.pitch > currentNote.pitch && currentNote.pitch > nextNote.pitch)) {
                return "passing";
            }
            // 刺繍音
            if (preNote.pitch === nextNote.pitch && Math.abs(preNote.pitch - currentNote.pitch) <= 3) {
                return "neighbor";
            }
            // 逸音
            if (Math.abs(preNote.pitch - currentNote.pitch) <= 3 && Math.abs(nextNote.pitch - currentNote.pitch) >= 3) {
                return "escape";
            }
        }
        // 倚音
        if (nextNote &&
            chordTrack.#includes(nextNote) &&
            Math.abs(currentNote.tick - Math.min(...chordTrack.#getCurrentNotes(currentNote.tick).map((note) => note.tick))) <= 10) {
            if (Math.abs(nextNote.pitch - currentNote.pitch) <= 3) {
                return "appoggiatura";
            }
        }
        // 先取音
        if (nextNote) {
            if (chordTrack
                .#getCurrentNotes(nextNote.tick)
                .map((note) => note.pitch % 12)
                .includes(currentNote.pitch % 12)) {
                return "anticipation";
            }
        }
        // それ以外
        return "non-harmonic";
    }
    getLength() {
        return Math.max(...this.notes.map((note) => note.tick + note.duration));
    }
    #getCurrentNotes(currentTime) {
        return this.notes.filter((note) => note.tick <= currentTime && currentTime < note.tick + note.duration);
    }
    #includes(note) {
        return this.#getCurrentNotes(note.tick)
            .map((note) => note.pitch % 12)
            .includes(note.pitch % 12);
    }
}
class Note {
    tick;
    pitch;
    duration;
    static #scale = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
    constructor(tick, pitch, duration) {
        this.tick = tick;
        this.pitch = pitch;
        this.duration = duration;
    }
    getElement(type = "melody") {
        const panel = document.createElement("span");
        panel.classList.add("note");
        if (type === "melody") {
            panel.style.left = `calc(${this.tick} * var(--width))`;
            panel.style.width = `calc(${this.duration} * var(--width))`;
        }
        else {
            panel.style.left = `calc(${this.tick} * var(--width) - var(--height) / 2 / 128)`;
            panel.style.width = `calc(var(--height) / 128)`;
            panel.style.borderRadius = "50%";
        }
        panel.style.top = `calc(var(--height) / 128 * ${128 - this.pitch})`;
        panel.title = Note.#scale[this.pitch % 12] + ~~(this.pitch / 12 - 1);
        return panel;
    }
}
class MidiFormatter {
    static async formatMidi(midi) {
        return Array.from(midi).map((track) => this.#formatTrack(track));
    }
    static #formatTrack(track) {
        const events = [];
        const noteOnMap = {}; // noteNumber -> absoluteTime
        let currentTime = 0;
        for (const e of Array.from(track)) {
            currentTime = e.tt;
            // noteOn
            if (e.isNoteOn()) {
                noteOnMap[e[1]] = currentTime;
                continue;
            }
            // noteOff || (noteOn && velocity = 0)
            if (e.isNoteOff() || (e.isNoteOn() && e.getVelocity() === 0)) {
                const startTime = noteOnMap[e[1]];
                if (startTime !== undefined) {
                    const duration = currentTime - startTime;
                    events.push(new Note(startTime, e[1], duration));
                    delete noteOnMap[e[1]];
                }
            }
        }
        return new Track(events);
    }
}
//# sourceMappingURL=Music.js.map