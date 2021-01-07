class ImageTransition {

    constructor(imageElem) {
        this.imageElem = imageElem;
    }

    start(newSrc) {

        return new Promise((resolve, reject) => {
            this.animateOut().then(() => {
                return this.loadNewSrc(newSrc);
            }).then(() => {
                return this.animateIn();
            }).then(() => {
                resolve();
            }).catch(err => {
                console.error(err);
                reject();
            });
        });

    }

    animateOut() {
        return new Promise((resolve, reject) => {

            const handleAnimationEnd = () => {
                this.imageElem.style.visibility = 'hidden';
                this.imageElem.classList.remove('animated', ImageTransition.OUT_CSS_ANIMATION);
                this.imageElem.removeEventListener('animationend', handleAnimationEnd);
                resolve();
            };
            this.imageElem.classList.add('animated', ImageTransition.OUT_CSS_ANIMATION);
            this.imageElem.addEventListener('animationend', handleAnimationEnd);

        });
    }

    loadNewSrc(newSrc) {
        return new Promise((resolve, reject) => {

            const oldSrc = this.imageElem.src;

            this.imageElem.src = newSrc;

            if (this.imageElem.complete) {
                resolve();
            } else {
                this.imageElem.addEventListener('load', () => {
                    resolve();
                });
                this.imageElem.addEventListener('error', () => {
                    console.error('Failed load image.');
                    this.imageElem.src = oldSrc;
                    reject();
                });
            }
        });
    }


    animateIn() {
        return new Promise((resolve, reject) => {

            const handleAnimationEnd = () => {
                this.imageElem.classList.remove('animated', ImageTransition.IN_CSS_ANIMATION);
                this.imageElem.removeEventListener('animationend', handleAnimationEnd);
                resolve();
            };

            this.imageElem.style.visibility = 'visible';
            this.imageElem.classList.add('animated', ImageTransition.IN_CSS_ANIMATION);
            this.imageElem.addEventListener('animationend', handleAnimationEnd)
        });
    }
}

ImageTransition.OUT_CSS_ANIMATION = 'flipOutX';
ImageTransition.IN_CSS_ANIMATION  = 'flipInX';
