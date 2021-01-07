class SyncView {

    constructor(barId, $container, $subtextContainer) {
        this.barId = barId;
        this.$container = $container;
        this.$subtextContainer = $subtextContainer;
        this.bar = null;
        this.barColour = Branding.DEFAULT_PROGRESS_CIRCLE_COLOUR;

        // Subtext busy elements.
        this.dot = '•';
        this.pot = '⦿';
        this.tickCounter = 0;
        this.maxTicks = 10;

        this.startTime = null;
        this.duration = null;
        this.initBar();
    }

    registerPresenter(presenter) {
        this.presenter = presenter;
    }

    show() {
        this.$container.show();
    }

    hide() {
        this.$container.hide();
        this.reset();
    }

    initBar() {
        console.log(`SyncView#initBar`);
        const ctx = this;

        const options = {
            color: '#909090',
            // This has to be the same size as the maximum width to prevent clipping.
            strokeWidth: 3,
            trailWidth: 1,
            easing: 'easeInOut',
            duration: 1400,
            text: {
                autoStyleContainer: false
            },
            from: {
                width: 2
            },
            to: {
                width: 3
            },
            // Set default step function for all animate calls
            step: function(state, circle) {
                circle.path.setAttribute('stroke', ctx.barColour);
                circle.path.setAttribute('stroke-width', state.width);
            }
        };

        this.bar = new ProgressBar.Circle(this.barId, options);
    }

    tick(subtext) {

        if (!this.bar.text) {
            return;
        }

        let text = this.bar.text.innerText.split(/[^a-zA-Z\d\s]/)[0];
        text = text.replace(/\n/g, '').trim();

        let ticks = '';
        for (let i = 0; i < this.maxTicks; i++) {
            ticks += (i === this.tickCounter) ? this.pot : this.dot;
        }

        this.bar.setText(text + '</br>' + ticks);
        this.tickCounter++;
        this.tickCounter %= this.maxTicks;

        if (subtext && this.$subtextContainer) {
            this.applySubtext(subtext);
        }
    }

    setProgressValue(value) {
        this.bar.animate(value);
    }

    clearSubtext (){
        this.applySubtext('');
    }

    applySubtext (text) {
        this.$subtextContainer.html(text);
    }

    setText(msg) {
        this.bar.setText(msg + '</br>&nbsp');
    }

    setProgressCircleColour(colour) {
        this.barColour = colour;
    }

    reset () {
        this.clearSubtext();
        this.tickCounter = 0;
        try {
            this.bar.destroy();
        } catch (e) {
            // Ignore. Already dead.
        }
        this.initBar();
    }


}
