import {
    IAudioGraph,
    IAudioNode,
    IAudioParam,
    IAudioWorkletProcessor,
    IAudioWorkletProcessorConstructor,
    INativeAudioNodeFaker,
    INativeAudioWorkletNode
} from './interfaces';
import { TNativeAudioNode, TNativeAudioParam, TNativeContext, TStandardizedContext } from './types';

export const AUDIO_NODE_STORE: WeakMap<IAudioNode, TNativeAudioNode | INativeAudioNodeFaker> = new WeakMap();

export const AUDIO_GRAPHS: WeakMap<TNativeContext | TStandardizedContext, IAudioGraph> = new WeakMap();

export const AUDIO_PARAM_STORE: WeakMap<IAudioParam, TNativeAudioParam> = new WeakMap();

export const CONTEXT_STORE: WeakMap<TStandardizedContext, TNativeContext> = new WeakMap();

export const DETACHED_ARRAY_BUFFERS: WeakSet<ArrayBuffer> = new WeakSet();

// This clunky name is borrowed from the spec. :-)
export const NODE_NAME_TO_PROCESSOR_DEFINITION_MAPS: WeakMap<
    TNativeContext,
    Map<string, IAudioWorkletProcessorConstructor>
> = new WeakMap();

export const NODE_TO_PROCESSOR_MAPS: WeakMap<
    TNativeContext,
    WeakMap<INativeAudioWorkletNode, Promise<IAudioWorkletProcessor>>
> = new WeakMap();

export const TEST_RESULTS: WeakMap<object, boolean> = new WeakMap();
