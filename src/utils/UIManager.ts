class UI {
    static pianoRoll: HTMLElement

    static #BPM: HTMLElement

    static init() {
        this.pianoRoll = document.getElementById("piano-roll")!

        this.#BPM = document.getElementById("BPM")!

        this.Zoom.init(this.pianoRoll)
        this.Play.init(this.pianoRoll)

        MidiPlayer.onTempoChange = (tempo) => {
            this.#BPM.innerText = tempo.toFixed(3)
        }

        this.resetPianoRoll()
    }

    static setPlayer(player: MidiPlayer) {
        this.Play.player = player
    }

    static resetPianoRoll() {
        this.pianoRoll.innerHTML = ""
        this.Play.createProgressBar(this.pianoRoll)
    }
}

namespace UI {
    export class Zoom {
        static zoomValue = 3
        static #buttonZoomIn: HTMLElement
        static #buttonZoomOut: HTMLElement

        static init(pianoRoll: HTMLElement) {
            this.#buttonZoomIn = document.getElementById("button-zoom-in")!
            this.#buttonZoomOut = document.getElementById("button-zoom-out")!

            this.#buttonZoomIn.onclick = () => {
                this.zoomValue = Math.min(this.zoomValue + 1, 5)
                this.#setZoomValue(pianoRoll)
            }

            this.#buttonZoomOut.onclick = () => {
                this.zoomValue = Math.max(this.zoomValue - 1, 1)
                this.#setZoomValue(pianoRoll)
            }
        }

        static #setZoomValue(pianoRoll: HTMLElement) {
            pianoRoll.style.setProperty("--width", `${(this.zoomValue / 3) * 0.1}px`)
        }
    }

    export class Play {
        static #buttonBack: HTMLElement
        static #buttonPlay: HTMLElement
        static #buttonStop: HTMLElement

        static #progressBar: HTMLElement
        static #progress = 0

        static player: MidiPlayer

        static createProgressBar(pianoRoll: HTMLElement) {
            this.#progressBar = document.createElement("span")
            this.#progressBar.classList.add("progress-bar")
            pianoRoll.appendChild(this.#progressBar)
        }

        static init(pianoRoll: HTMLElement) {
            this.#buttonBack = document.getElementById("button-back")!
            this.#buttonPlay = document.getElementById("button-play")!
            this.#buttonStop = document.getElementById("button-stop")!

            this.#buttonBack.onclick = () => {
                this.#progress = 0
                this.#progressBar.style.left = `calc(${this.#progress} * var(--width))`
                this.#progressBar.scrollIntoView({ behavior: "smooth" })
            }

            this.#buttonPlay.onclick = () => {
                this.player.currentTick = this.#progress
                this.player.play()
            }

            this.#buttonStop.onclick = () => {
                this.player.stop()
                this.#progressBar.style.left = `calc(${this.#progress} * var(--width))`
            }

            document.addEventListener("keydown", (e) => {
                if (e.code === "Space") {
                    e.preventDefault()
                    this.player.isPlaying() ? this.#buttonStop.click() : this.#buttonPlay.click()
                }
            })

            pianoRoll.onclick = (e) => {
                if (this.player.isPlaying()) return
                this.#progress = Math.round((e.offsetX * 10) / 240 / (UI.Zoom.zoomValue / 3)) * 240
                this.#progressBar.style.left = `calc(${this.#progress} * var(--width))`
            }

            MidiPlayer.onProgress = (currentTick) => {
                this.#progressBar.style.left = `calc(${currentTick} * var(--width))`
            }
        }
    }
}
