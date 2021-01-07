/**
 * Depends on jQuery confirm library to show dialog with states
 */
class StateManagerView {

    constructor() {}

    registerPresenter(presenter) {
        this.presenter = presenter;
    }

    show(states){

        const config = {
            title: "Session Manager",
            buttons: {
                clearAll: {
                    text: 'Clear All Sessions',
                    action: () => {
                        this.clearAllListener();
                    }
                },
                cancel: {
                    text: 'Cancel',
                    action: () => this.cancelListener()
                }
            },
            content: this.formatContent(states),
            useBootstrap: false,
            boxWidth: '75%',
            animation: 'top'
        };

        this.dialog = $.confirm(config);
        setTimeout(() => this.initAccordion(), 1000);
    }

    initAccordion() {
        const coll = document.getElementsByClassName("collapsible");

        for (let i = 0; i < coll.length; i++) {
            coll[i].addEventListener("click", function() {
                this.classList.toggle("active");

                const icon = this.getElementsByClassName('fas')[0];
                icon.classList.toggle("down");

                const content = this.nextElementSibling;

                if (content.style.maxHeight){
                    content.style.maxHeight = null;
                } else {
                    content.style.maxHeight = content.scrollHeight + "px";
                }
            });
        }
    }

    clearAllListener() {
        this.presenter.onClearAllClick();
    }

    cancelListener() {


        this.presenter.onCancelClick()
    }

    formatContent(states) {

        if (states.isEmpty()) {
            return `<p>There are currently no app sessions saved on the device.</p>`;
        }

        const stateChains = states.getStates();

        let ulContent = null;

        for (let i = 0; i < stateChains.length; i++) {
            const stateChain = stateChains[i];
            const rootState = stateChain.getRoot();
            const hasChildren = stateChain.hasChildren();

            const modeHtml = rootState.getModeId() === 8 ? '(Test)' : rootState.getModeId() === 7 ? '(Preview)' : '';


            let rootStateHtml = `<button class="collapsible" ${hasChildren ? "" : "disabled"}>• ${rootState.getName()} ${modeHtml} ${hasChildren ? `<i class="fas fa-chevron-down rotate"></i>` : ``}</button><div class="content"><ul>`;

            // Starting from 1 as 0 is root which is already processed
            for (let j = 1; j < stateChain.length; j++) {
                const childState = stateChain.getChild(j);
                const childHtml = `<li>${childState.getName()}</li>`;
                rootStateHtml += childHtml;
            }

            rootStateHtml += '</ul></div>';

            if (ulContent) {
                ulContent += rootStateHtml;
            } else {
                ulContent = rootStateHtml;
            }
        }

        let html = `<div id="stateManager"><div class="listing"><p>You have unfinished sessions saved in the following app${states.getCount() > 1 ? 's' : ''}:</p><div id="stateAccordionContainer">${ulContent}</div></div></div>`;

        return html;
    }

    showStateClearedAlert() {
        const config = {
            title: "Done!",
            content: this.buildConfirmationContent(),
            onOpen: () => {
                $('.circle-loader').toggleClass('load-complete');
                $('.checkmark').toggle();
            },
            useBootstrap: false,
            boxWidth: '75%',
            animation: 'top'
        };

        this.dialog = $.alert(config);
    }

    buildConfirmationContent() {
        return '<div id="stateClearedAlert"><div class="circle-loader"><div class="checkmark draw"></div></div></div>'
    }

    showNoStates() {

        const content  = `<p>There are currently no app sessions saved on the device.</p>`;

        const config = {
            title: "Session Manager",
            buttons: {
                clearAll: {
                    text: 'OK',
                    action: () => {}
                }
            },
            content: content,
            useBootstrap: false,
            boxWidth: '75%',
            animation: 'zoom'

        };

        this.dialog = $.confirm(config);
    }
}
