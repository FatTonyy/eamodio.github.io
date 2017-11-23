'use strict'
import Typed, { TypedOptions } from 'typed.js';

export class MainView {

    typingCompleted = false;

    private typingSubhead: Typed | undefined;
    private typingDesc: Typed | undefined;

    activate(previous?: string) {
        if (previous) {
            setTimeout(() => this.startSubheadTyping(), 1000);
        }
        else {
            this.startSubheadTyping();
        }
    }

    pause(): boolean {
        if (this.typingSubhead !== undefined || this.typingDesc !== undefined) {
            this.typingSubhead && this.typingSubhead.stop();
            this.typingDesc && this.typingDesc.stop();

            return true;
        }

        return false;
    }

    resume(): boolean {
        if (this.typingSubhead !== undefined || this.typingDesc !== undefined) {
            setTimeout(() => {
                this.typingSubhead && this.typingSubhead.start();
                this.typingDesc && this.typingDesc.start();
            }, 1000);

            return true;
        }

        return false;
    }

    private onSubheadTypingCompleted(strings: string[]) {
        setTimeout(() => {
            this.typingSubhead!.destroy();
            this.typingSubhead = undefined;
            document.getElementById('subhead')!.innerText = strings[strings.length - 1];

            this.startDescTyping();
        }, 750);
    }

    private onDescTypingCompleted(strings: string[]) {
        this.typingCompleted = true;

        const els = document.querySelectorAll('.on-hero-complete')!;
        for (const el of els) {
            el.classList.remove('hidden');
        }

        setTimeout(() => {
            this.typingDesc!.destroy();
            this.typingDesc = undefined;
            document.getElementById('desc')!.innerHTML = strings[strings.length - 1];
        }, 1000);
    }

    private startSubheadTyping() {
        const strings = ['entrepreneur', 'leader', 'innovator', 'architect', 'developer.'];
        this.typingSubhead = new Typed('#subhead', {
            strings: strings,
            autoInsertCss: false,
            backDelay: 1500,
            backSpeed: 30,
            typeSpeed: 90,
            onComplete: () => this.onSubheadTypingCompleted(strings)
        } as TypedOptions);
    }

    private startDescTyping() {
        const strings = ['full-stack<br /><span class="heart">&#10084;</span> open source'];
        this.typingDesc = new Typed('#desc', {
            strings: strings,
            autoInsertCss: false,
            backDelay: 1500,
            backSpeed: 30,
            typeSpeed: 90,
            onComplete: () => this.onDescTypingCompleted(strings)
        } as TypedOptions);
    };
}
