import _ from 'lodash'
import React, { ReactNode } from 'react'
import { connect } from 'react-redux'
import { AppHost, ExtensionItem, ExtensionSlot, PrivateShell, ReactComponentContributor, SoloReactComponentContributor } from './API'
import { ErrorBoundary } from './errorBoundary'
import { ShellContext } from './shellContext'

export function renderShellComponent(shell: PrivateShell, component: React.ReactNode, key: any, name?: string): React.ReactNode {
    return (
        <ErrorBoundary key={key} shell={shell} componentName={name}>
            <ShellContext.Provider value={shell}>{component}</ShellContext.Provider>
        </ErrorBoundary>
    )
}

export function renderSlotComponents(slot: ExtensionSlot<ReactComponentContributor>): React.ReactNode[] {
    return slot.getItems().map((item, index) =>
        renderShellComponent(
            item.shell,
            item.contribution(),
            index, // index is the key prop
            item.name
        )
    )
}

type ReactContributorExtensionItem = ExtensionItem<ReactComponentContributor> | ExtensionItem<SoloReactComponentContributor>
type ReactContributorExtensionSlot = ExtensionSlot<ReactComponentContributor> | ExtensionSlot<SoloReactComponentContributor>

interface SlotRendererPureProps {
    items: ReactContributorExtensionItem[]
    Wrapper?: React.ComponentType<any>
    wrapperPropsGetter?: (item: ExtensionItem<any>, index: number) => object
}
const SlotRendererPure: React.FunctionComponent<SlotRendererPureProps> = ({ items, Wrapper, wrapperPropsGetter }) => (
    <>
        {items.map((item, index) => {
            const props = (wrapperPropsGetter || _.stubObject)(item, index)
            return Wrapper ? (
                <Wrapper {...props} key={index}>
                    {renderExtensionItem(item, index, props.children)}
                </Wrapper>
            ) : (
                renderExtensionItem(item, index)
            )
        })}
    </>
)

interface SlotRendererConnectedProps {
    slot: ReactContributorExtensionSlot
}
export const SlotRenderer = connect((state, { slot }: SlotRendererConnectedProps) => ({ items: slot.getItems() }))(SlotRendererPure)

const renderExtensionItem = (item: ReactContributorExtensionItem, index: number, children?: ReactNode) =>
    renderShellComponent(
        item.shell,
        <ConnectedPredicateHoc index={index} item={item}>
            {children}
        </ConnectedPredicateHoc>,
        index, // index is the key prop
        item.name
    )

export function renderSlotComponentsConnected(
    slot: ReactContributorExtensionSlot,
    Wrapper?: React.ComponentType<any>,
    wrapperPropsGetter?: (item: ExtensionItem<any>, index: number) => object
): ReactNode {
    return <SlotRenderer slot={slot} Wrapper={Wrapper} wrapperPropsGetter={wrapperPropsGetter} />
}

interface PredicateHocProps {
    index: number
    render: ReactComponentContributor
    children?: ReactNode
    predicateResult: boolean
}

const PredicateHoc: React.FunctionComponent<PredicateHocProps> = props => (
    <>{props.predicateResult ? props.children || props.render() : null}</>
)

interface ConnectedPredicateHocProps {
    index: number
    item: ExtensionItem<ReactComponentContributor>
    children?: ReactNode
}

const mapPredicateHocStateToProps = (state: any, ownProps: ConnectedPredicateHocProps): PredicateHocProps => ({
    index: ownProps.index,
    render: ownProps.item.contribution,
    children: ownProps.children,
    predicateResult: ownProps.item.condition()
})

const ConnectedPredicateHoc = connect(mapPredicateHocStateToProps)(PredicateHoc)