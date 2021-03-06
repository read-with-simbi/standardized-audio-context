import { IAudioNode } from '../interfaces';
import { TContext } from './context';

export type TDecrementCycleCounterFunction = <T extends TContext>(audioNode: IAudioNode<T>, count: number) => void;
