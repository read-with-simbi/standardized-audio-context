describe('AudioWorklet', () => {
    let audioContext;

    afterEach(() => audioContext.close());

    beforeEach(() => {
        audioContext = new AudioContext();
    });

    describe('with the name of an unknown processor', () => {
        // bug #60

        it('should throw an InvalidStateError', (done) => {
            try {
                new AudioWorkletNode(audioContext, 'unknown-processor');
            } catch (err) {
                expect(err.code).to.equal(11);
                expect(err.name).to.equal('InvalidStateError');

                done();
            }
        });
    });

    describe('without specified maxValue and minValue values', () => {
        // bug #82

        it('should be 3.402820018375656e+38 and -3.402820018375656e+38', async function () {
            this.timeout(10000);

            await audioContext.audioWorklet.addModule('base/test/fixtures/gain-processor.js');

            const audioWorkletNode = new AudioWorkletNode(audioContext, 'gain-processor');

            expect(audioWorkletNode.parameters.get('gain').maxValue).to.equal(3.402820018375656e38);
            expect(audioWorkletNode.parameters.get('gain').minValue).to.equal(-3.402820018375656e38);
        });
    });

    describe('with a module depending on another module', () => {
        beforeEach(async function () {
            this.timeout(10000);

            await audioContext.audioWorklet.addModule('base/test/fixtures/library.js');
            await audioContext.audioWorklet.addModule('base/test/fixtures/dependent-processor.js');
        });

        // bug #91

        it('should not persist the scope across calls to addModule()', (done) => {
            const audioWorkletNode = new AudioWorkletNode(audioContext, 'dependent-processor');

            audioWorkletNode.port.onmessage = ({ data }) => {
                audioWorkletNode.port.onmessage = null;

                expect(data.typeOfLibrary).to.equal('undefined');

                done();
            };

            audioWorkletNode.port.postMessage(null);
        });
    });

    describe('with a failing processor', () => {
        beforeEach(async function () {
            this.timeout(10000);

            await audioContext.audioWorklet.addModule('base/test/fixtures/failing-processor.js');
        });

        // bug #178

        it('should fire an error event', function (done) {
            this.timeout(10000);

            const audioWorkletNode = new AudioWorkletNode(audioContext, 'failing-processor');

            audioWorkletNode.onprocessorerror = function (event) {
                expect(event.type).to.equal('error');

                done();
            };

            audioWorkletNode.connect(audioContext.destination);
        });
    });
});
