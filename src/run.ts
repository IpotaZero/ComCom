declare const JZZ: any

document.addEventListener("DOMContentLoaded", async () => {
    try {
        MidiOutputManager.init()
    } catch (e) {
        alert(e)
    }

    let midi = new JZZ.MIDI.SMF(await electron.loadFile("test-midi/l1.mid"))

    const music = new Music(midi)

    await music.isReady

    const pianoRoll = document.getElementById("piano-roll")!

    music.displayTo(pianoRoll)

    const track = document.getElementById("track-2")!
    track.innerHTML = ""
    track.style.filter = ""
    music.tracks[2].displayWithAnalyze(track, music.tracks[3])

    console.log(music)

    UI.init(pianoRoll)
    UI.setPlayer(new MidiPlayer(midi))
})

class UI {
    static #buttonBack: HTMLElement
    static #buttonPlay: HTMLElement
    static #buttonStop: HTMLElement

    static #BPM: HTMLElement

    static #progressBar = document.createElement("span")
    static #progress = 0

    static #player: MidiPlayer

    static init(pianoRoll: HTMLElement) {
        this.#buttonBack = document.getElementById("button-back")!
        this.#buttonPlay = document.getElementById("button-play")!
        this.#buttonStop = document.getElementById("button-stop")!

        this.#BPM = document.getElementById("BPM")!

        document.addEventListener("keydown", (e) => {
            if (e.code === "Space") {
                e.preventDefault()
                this.#player.isPlaying() ? this.#buttonStop.click() : this.#buttonPlay.click()
            }
        })

        this.#buttonBack.onclick = () => {
            this.#progress = 0
            this.#progressBar.style.left = `calc(${this.#progress} * var(--width))`
            this.#progressBar.scrollIntoView({ behavior: "smooth" })
        }

        this.#buttonPlay.onclick = () => {
            this.#player.currentTick = this.#progress
            this.#player.play()
        }

        this.#buttonStop.onclick = () => {
            this.#player.stop()
            this.#progressBar.style.left = `calc(${this.#progress} * var(--width))`
        }

        pianoRoll.onclick = (e) => {
            this.#progress = Math.round((e.offsetX * 10) / 240) * 240
            this.#progressBar.style.left = `calc(${this.#progress} * var(--width) - 1px)`
        }

        this.#progressBar.classList.add("progress-bar")
        pianoRoll.appendChild(this.#progressBar)

        MidiPlayer.onTempoChange = (tempo) => {
            this.#BPM.innerText = tempo.toFixed(3)
        }

        MidiPlayer.onProgress = (currentTick) => {
            this.#progressBar.style.left = `calc(${currentTick} * var(--width) - 1px)`
        }
    }

    static setPlayer(player: MidiPlayer) {
        this.#player = player
    }
}
