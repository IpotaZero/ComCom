declare const electron: Electron

interface Electron {
    loadFile: (filePath: string) => Promise<string>
    writeFile: (filePath: string, binary: string) => Promise<void>
}

type MidiEvent = {
    0: number
    1: number
    2: number
    tt: number
}

class MidiFormatter {
    static async formatMidi(midi: any): Promise<Track[]> {
        return Array.from(midi).map((track) => this.#formatTrack(track))
    }

    static #formatTrack(track: any): Track {
        const events: Note[] = []
        const noteOnMap: Record<number, number> = {} // noteNumber -> absoluteTime
        let currentTime = 0

        for (const e of Array.from(track) as any) {
            currentTime = e.tt

            // noteOn
            if (this.#isNoteOn(e)) {
                noteOnMap[e[1]] = currentTime
                continue
            }

            // noteOff || (noteOn && velocity = 0)
            if (this.#isNoteOff(e) || (this.#isNoteOn(e) && e[2] === 0)) {
                const startTime = noteOnMap[e[1]]
                if (startTime !== undefined) {
                    const duration = currentTime - startTime
                    events.push(new Note(startTime, e[1], duration))
                    delete noteOnMap[e[1]]
                }
            }
        }

        return new Track(events)
    }

    static #isNoteOn(event: any) {
        return 0x90 <= event[0] && event[0] < 0x90 + 16
    }

    static #isNoteOff(event: any) {
        return 0x80 <= event[0] && event[0] < 0x80 + 16
    }
}

// midiを捨象したデータ
class Music {
    isReady: Promise<void>

    tracks: Track[] = []
    #key: number

    constructor(midi: any, key: number) {
        this.#key = key
        this.isReady = (async () => {
            this.tracks = await MidiFormatter.formatMidi(midi)
        })()
    }

    displayTo(screen: HTMLElement) {
        const pianoRollWidth = (~~(this.#getLength() / (480 * 4)) + 1) * (480 * 4)
        screen.style.width = `calc(${pianoRollWidth} * var(--width))`

        const lines = document.createElement("div")
        lines.classList.add("lines")
        this.#drawLines(lines, pianoRollWidth)
        screen.appendChild(lines)

        this.tracks.forEach((track, i) => {
            const trackDiv = document.createElement("div")
            trackDiv.classList.add("track")
            trackDiv.id = "track-" + i
            screen.appendChild(trackDiv)
            track.displayTo(trackDiv, i === 11 ? "rhythm" : "melody")
        })
    }

    #drawLines(screen: HTMLElement, width: number) {
        for (let x = 240; x < width; x += 480 * 4) {
            const barLine = document.createElement("span")
            barLine.classList.add("bar-line")
            barLine.style.left = `calc(${x} * var(--width))`
            screen.appendChild(barLine)

            for (let i = 0; i < 3; i++) {
                const beatLine = document.createElement("span")
                beatLine.classList.add("beat-line")
                beatLine.style.left = `calc(${x + 480 * (i + 1)} * var(--width))`
                screen.appendChild(beatLine)
            }
        }
    }

    #getLength() {
        return Math.max(...this.tracks.map((track) => track.getLength()))
    }
}

// ダイアトニック
// 0,2,4,5,7,9,11

class Track {
    constructor(public notes: Note[]) {}

    displayTo(screen: HTMLElement, type: "melody" | "rhythm" = "melody") {
        this.notes.forEach((note) => {
            const elm = note.getElement(type)
            screen.appendChild(elm)
        })
    }

    displayWithAnalyze(screen: HTMLElement, chordTrack: Track) {
        for (let i = 0; i < this.notes.length; i++) {
            const harmonicType = this.#getHarmonicType(
                this.notes[i - 1] ?? null,
                this.notes[i],
                this.notes[i + 1] ?? null,
                chordTrack,
            )

            const elm = this.notes[i].getElement()
            elm.classList.add(harmonicType)
            screen.appendChild(elm)
        }
    }

    #getHarmonicType(preNote: Note | null, currentNote: Note, nextNote: Note | null, chordTrack: Track) {
        // 和声音
        if (chordTrack.#includes(currentNote)) {
            return "harmonic"
        }

        if (preNote && nextNote && chordTrack.#includes(preNote) && chordTrack.#includes(nextNote)) {
            // 経過音
            if (
                (preNote.pitch < currentNote.pitch && currentNote.pitch < nextNote.pitch) ||
                (preNote.pitch > currentNote.pitch && currentNote.pitch > nextNote.pitch)
            ) {
                return "passing"
            }

            // 刺繍音
            if (preNote.pitch === nextNote.pitch && Math.abs(preNote.pitch - currentNote.pitch) <= 3) {
                return "neighbor"
            }

            // 逸音
            if (Math.abs(preNote.pitch - currentNote.pitch) <= 3 && Math.abs(nextNote.pitch - currentNote.pitch) >= 3) {
                return "escape"
            }
        }

        // 倚音
        if (
            nextNote &&
            chordTrack.#includes(nextNote) &&
            Math.abs(
                currentNote.tick - Math.min(...chordTrack.#getCurrentNotes(currentNote.tick).map((note) => note.tick)),
            ) <= 10
        ) {
            if (Math.abs(nextNote.pitch - currentNote.pitch) <= 3) {
                return "appoggiatura"
            }
        }

        // 先取音
        if (nextNote) {
            if (
                chordTrack
                    .#getCurrentNotes(nextNote.tick)
                    .map((note) => note.pitch % 12)
                    .includes(currentNote.pitch % 12)
            ) {
                return "anticipation"
            }
        }

        // それ以外
        return "non-harmonic"
    }

    getLength() {
        return Math.max(...this.notes.map((note) => note.tick + note.duration))
    }

    #getCurrentNotes(currentTime: number): Note[] {
        return this.notes.filter((note) => note.tick <= currentTime && currentTime < note.tick + note.duration)
    }

    #includes(note: Note) {
        return this.#getCurrentNotes(note.tick)
            .map((note) => note.pitch % 12)
            .includes(note.pitch % 12)
    }
}

class Note {
    static #scale = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"] as const

    constructor(public tick: number, public pitch: number, public duration: number) {}

    getElement(type: "melody" | "rhythm" = "melody") {
        const panel = document.createElement("span")

        panel.classList.add("note")

        if (type === "melody") {
            panel.style.left = `calc(${this.tick} * var(--width))`
            panel.style.width = `calc(${this.duration} * var(--width))`
        } else {
            panel.style.left = `calc(${this.tick} * var(--width) - var(--height) / 2 / 128)`
            panel.style.width = `calc(var(--height) / 128)`
            panel.style.borderRadius = "50%"
        }

        panel.style.top = `calc(var(--height) / 128 * ${128 - this.pitch})`

        panel.title = Note.#scale[this.pitch % 12] + ~~(this.pitch / 12 - 1)

        return panel
    }
}
