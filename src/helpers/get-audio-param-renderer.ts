import { getAudioParamConnections } from '../helpers/get-audio-param-connections';
import { IAudioParam, IAudioParamRenderer } from '../interfaces';
import { TAnyContext } from '../types';

export function getAudioParamRenderer (anyContext: TAnyContext, audioParam: IAudioParam): IAudioParamRenderer {
    const audioParamConnections = getAudioParamConnections(anyContext, audioParam);

    if (audioParamConnections.renderer === null) {
        throw new Error('Missing the renderer of the given AudioParam in the audio graph.');
    }

    return audioParamConnections.renderer;
}
