class MidiOutputManager {
    static output: MIDIOutput

    static async init() {
        const access = await navigator.requestMIDIAccess({ sysex: true })
        const outputs = Array.from(access.outputs.values())
        if (!outputs.length) throw new Error("No MIDI outputs available")
        this.output = outputs[0]
    }

    static stop() {
        for (let i = 0; i < 128; i++) {
            this.output.send([0x80, i, 100])
        }
    }
}

class MidiPlayer {
    #events: any[]

    #canceled = false
    #isPlaying = false

    #tempo = 500000

    currentTick = 0

    static onTempoChange = (BPM: number) => {}
    static onProgress = (currentTick: number) => {}

    constructor(midi: any) {
        this.#events = this.#format(Array.from(midi.player()._data))
    }

    #format(events: any[]) {
        return events.toSorted((a, b) => a.tt - b.tt)
        // return events.filter((event) => event.isNoteOn() || event.isNoteOff())
    }

    async play() {
        if (!MidiOutputManager.output) throw new Error("midi output is not initialized.")

        this.#canceled = false

        const events = this.#events.filter((event) => event.tt >= this.currentTick)

        let currentTick = this.currentTick

        this.#isPlaying = true

        for (const event of events) {
            if (event.isTempo()) {
                this.#tempo = event.getTempo()
                MidiPlayer.onTempoChange(120 * (500000 / this.#tempo))
            }

            const elapsedTime = (event.tt - currentTick) * (this.#tempo / 500000)

            currentTick = event.tt

            if (elapsedTime > 0) {
                await Awaits.sleep(elapsedTime)
                MidiPlayer.onProgress(currentTick)
            }

            if (this.#canceled) break

            MidiOutputManager.output.send(event)
        }

        this.#isPlaying = false
    }

    async stop() {
        this.#canceled = true

        await Awaits.sleep(1000)

        MidiOutputManager.stop()
    }

    isPlaying() {
        return this.#isPlaying
    }
}
