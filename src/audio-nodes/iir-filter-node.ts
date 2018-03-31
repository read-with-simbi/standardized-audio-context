import { Injector } from '@angular/core';
import { IIRFilterNodeFaker, IIR_FILTER_NODE_FAKER_PROVIDER } from '../fakers/iir-filter-node';
import { AUDIO_NODE_RENDERER_STORE } from '../globals';
import { getNativeContext } from '../helpers/get-native-context';
import { isOfflineAudioContext } from '../helpers/is-offline-audio-context';
import { IIIRFilterNode, IIIRFilterOptions, IMinimalBaseAudioContext } from '../interfaces';
import { IIRFilterNodeRenderer } from '../renderers/iir-filter-node';
import {
    TChannelCountMode,
    TChannelInterpretation,
    TNativeIIRFilterNode,
    TUnpatchedAudioContext,
    TUnpatchedOfflineAudioContext
} from '../types';
import {
    IIRFilterNodeGetFrequencyResponseMethodWrapper,
    IIR_FILTER_NODE_GET_FREQUENCY_RESPONSE_METHOD_WRAPPER_PROVIDER
} from '../wrappers/iir-filter-node-get-frequency-response-method';
import { NoneAudioDestinationNode } from './none-audio-destination-node';

// The DEFAULT_OPTIONS are only of type Partial<IIIRFilterOptions> because there are no default values for feedback and feedforward.
const DEFAULT_OPTIONS: Partial<IIIRFilterOptions> = {
    channelCount: 2,
    channelCountMode: <TChannelCountMode> 'max',
    channelInterpretation: <TChannelInterpretation> 'speakers'
};

const injector = Injector.create({
    providers: [
        IIR_FILTER_NODE_FAKER_PROVIDER,
        IIR_FILTER_NODE_GET_FREQUENCY_RESPONSE_METHOD_WRAPPER_PROVIDER
    ]
});

const iIRFilterNodeFaker = injector.get<IIRFilterNodeFaker>(IIRFilterNodeFaker);
const iIRFilterNodeGetFrequencyResponseMethodWrapper = injector
    .get<IIRFilterNodeGetFrequencyResponseMethodWrapper>(IIRFilterNodeGetFrequencyResponseMethodWrapper);

const createNativeNode = (
    nativeContext: TUnpatchedAudioContext | TUnpatchedOfflineAudioContext,
    options: IIIRFilterOptions
): TNativeIIRFilterNode => {
    // Bug #9: Safari does not support IIRFilterNodes.
    if (nativeContext.createIIRFilter === undefined) {
        return iIRFilterNodeFaker.fake(nativeContext, options);
    }

    const iIRFilterNode = nativeContext.createIIRFilter(<number[]> options.feedforward, <number[]> options.feedback);

    if (options.channelCount !== undefined) {
        iIRFilterNode.channelCount = options.channelCount;
    }

    if (options.channelCountMode !== undefined) {
        iIRFilterNode.channelCountMode = options.channelCountMode;
    }

    if (options.channelInterpretation !== undefined) {
        iIRFilterNode.channelInterpretation = options.channelInterpretation;
    }

    return iIRFilterNode;
};

export class IIRFilterNode extends NoneAudioDestinationNode<TNativeIIRFilterNode> implements IIIRFilterNode {

    constructor (
        context: IMinimalBaseAudioContext,
        options: { feedback: IIIRFilterOptions['feedback']; feedforward: IIIRFilterOptions['feedforward'] } & Partial<IIIRFilterOptions>
    ) {
        const nativeContext = getNativeContext(context);
        const mergedOptions = <IIIRFilterOptions> { ...DEFAULT_OPTIONS, ...options };
        const nativeNode = createNativeNode(nativeContext, mergedOptions);

        super(context, nativeNode, mergedOptions.channelCount);

        // Bug #23 & #24: FirefoxDeveloper does not throw an InvalidAccessError.
        // @todo Write a test which allows other browsers to remain unpatched.
        iIRFilterNodeGetFrequencyResponseMethodWrapper.wrap(nativeNode);

        if (isOfflineAudioContext(nativeContext)) {
            const iirFilterNodeRenderer = new IIRFilterNodeRenderer(this, mergedOptions.feedback, mergedOptions.feedforward);

            AUDIO_NODE_RENDERER_STORE.set(this, iirFilterNodeRenderer);
        }
    }

    public getFrequencyResponse (frequencyHz: Float32Array, magResponse: Float32Array, phaseResponse: Float32Array) {
        return this._nativeNode.getFrequencyResponse(frequencyHz, magResponse, phaseResponse);
    }

}
