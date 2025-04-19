class MidiPlayer {
    #output: MIDIOutput | null
    #events: any[]
    #canceled = false

    #tempo = 500000

    currentTick = 0
    #isPlaying = false

    static onTempoChange = (tempo: number) => {}
    static onProgress = (currentTick: number) => {}

    constructor(midi: any) {
        this.#events = this.#format(Array.from(midi.player()._data))
        this.#output = null
    }

    #format(events: any[]) {
        return events.toSorted((a, b) => a.tt - b.tt)
        // return events.filter((event) => event.isNoteOn() || event.isNoteOff())
    }

    async initOutput() {
        const access = await navigator.requestMIDIAccess({ sysex: true })
        const outputs = Array.from(access.outputs.values())
        if (!outputs.length) throw new Error("No MIDI outputs available")
        this.#output = outputs[0]
    }

    async play() {
        if (!this.#output) await this.initOutput()

        this.#canceled = false
        this.#isPlaying = true

        const events = this.#events.filter((event) => event.tt >= this.currentTick)

        let currentTick = this.currentTick

        const context = new AudioContext()

        for (const event of events) {
            if (event.isTempo()) {
                this.#tempo = event.getTempo()
                MidiPlayer.onTempoChange(120 * (500000 / this.#tempo))
            }

            MidiPlayer.onProgress(currentTick)

            const elapsedTime = (event.tt - currentTick) * (this.#tempo / 500000)

            currentTick = event.tt

            if (elapsedTime > 0) await Awaits.audio(elapsedTime, context)

            if (this.#canceled) break

            this.#output!.send(event)
        }

        this.#isPlaying = false
    }

    stop() {
        this.#canceled = true

        for (let i = 0; i < 128; i++) {
            this.#output?.send([0x80, i, 100])
        }
    }

    isPlaying() {
        return this.#isPlaying
    }
}
