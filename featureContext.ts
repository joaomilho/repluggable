import { createContext } from 'react'
import { ExtensionSlot, SlotKey } from './api'

export interface FeatureContext {
    readonly name: string
    getSlot<TItem>(key: SlotKey<TItem>): ExtensionSlot<TItem>
    // readonly log: FeatureLogger; //TODO: define logging abstraction
}

export const FeatureContext = createContext<FeatureContext | null>(null) as React.Context<FeatureContext>
