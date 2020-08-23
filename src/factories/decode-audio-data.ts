import { detachArrayBuffer } from '../helpers/detach-array-buffer';
import { wrapAudioBufferGetChannelDataMethod } from '../helpers/wrap-audio-buffer-get-channel-data-method';
import { TDecodeAudioDataFactory } from '../types';

export const createDecodeAudioData: TDecodeAudioDataFactory = (
    audioBufferStore,
    cacheTestResult,
    createDataCloneError,
    createEncodingError,
    detachedArrayBuffers,
    getNativeContext,
    isNativeContext,
    isNativeOfflineAudioContext,
    nativeOfflineAudioContextConstructor,
    testAudioBufferCopyChannelMethodsOutOfBoundsSupport,
    testPromiseSupport,
    wrapAudioBufferCopyChannelMethods,
    wrapAudioBufferCopyChannelMethodsOutOfBounds
) => {
    return (anyContext, audioData) => {
        const nativeContext = isNativeContext(anyContext) ? anyContext : getNativeContext(anyContext);

        // Bug #43: Only Chrome, Edge and Opera do throw a DataCloneError.
        if (detachedArrayBuffers.has(audioData)) {
            const err = createDataCloneError();

            return Promise.reject(err);
        }

        // The audioData parameter maybe of a type which can't be added to a WeakSet.
        try {
            detachedArrayBuffers.add(audioData);
        } catch {
            // Ignore errors.
        }

        // Bug #21: Safari does not support promises yet.
        if (cacheTestResult(testPromiseSupport, () => testPromiseSupport(nativeContext))) {
            // Bug #101: Edge does not decode something on a closed OfflineAudioContext.
            const nativeContextOrBackupNativeContext =
                nativeContext.state === 'closed' &&
                nativeOfflineAudioContextConstructor !== null &&
                isNativeOfflineAudioContext(nativeContext)
                    ? new nativeOfflineAudioContextConstructor(1, 1, nativeContext.sampleRate)
                    : nativeContext;

            const promise = nativeContextOrBackupNativeContext.decodeAudioData(audioData).catch((err: DOMException | Error) => {
                // Bug #27: Edge is rejecting invalid arrayBuffers with a DOMException.
                if (err instanceof DOMException && err.name === 'NotSupportedError') {
                    throw new TypeError();
                }

                throw err;
            });

            return promise.then((audioBuffer) => {
                // Bug #157: Firefox does not allow the bufferOffset to be out-of-bounds.
                if (
                    !cacheTestResult(testAudioBufferCopyChannelMethodsOutOfBoundsSupport, () =>
                        testAudioBufferCopyChannelMethodsOutOfBoundsSupport(audioBuffer)
                    )
                ) {
                    wrapAudioBufferCopyChannelMethodsOutOfBounds(audioBuffer);
                }

                audioBufferStore.add(audioBuffer);

                return audioBuffer;
            });
        }

        // Bug #21: Safari does not return a Promise yet.
        return new Promise((resolve, reject) => {
            const complete = () => {
                // Bug #133: Safari does neuter the ArrayBuffer.
                try {
                    detachArrayBuffer(audioData);
                } catch {
                    // Ignore errors.
                }
            };

            const fail = (err: DOMException | Error) => {
                reject(err);
                complete();
            };

            // Bug #26: Safari throws a synchronous error.
            try {
                // Bug #1: Safari requires a successCallback.
                nativeContext.decodeAudioData(
                    audioData,
                    (audioBuffer) => {
                        // Bug #5: Safari does not support copyFromChannel() and copyToChannel().
                        // Bug #100: Safari does throw a wrong error when calling getChannelData() with an out-of-bounds value.
                        if (typeof audioBuffer.copyFromChannel !== 'function') {
                            wrapAudioBufferCopyChannelMethods(audioBuffer);
                            wrapAudioBufferGetChannelDataMethod(audioBuffer);
                        }

                        audioBufferStore.add(audioBuffer);

                        complete();
                        resolve(audioBuffer);
                    },
                    (err: DOMException | Error) => {
                        // Bug #4: Safari returns null instead of an error.
                        if (err === null) {
                            fail(createEncodingError());
                        } else {
                            fail(err);
                        }
                    }
                );
            } catch (err) {
                fail(err);
            }
        });
    };
};
