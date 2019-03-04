
import * as PropTypes from 'prop-types';
import React, { ComponentType, Dispatch } from 'react';
import { connect as reduxConnect, ConnectedComponentClass, InferableComponentEnhancerWithProps, Matching } from 'react-redux';
import { Action } from 'redux';
import { AnyFeature, ExtensionItemFilter, FeatureActivationPredicate, SlotKey, ScopedStore } from './api';
import { FeatureContext } from './featureContext'

export const featureContextTypes = {
    getSlot: PropTypes.func.isRequired,
    getStore: PropTypes.func.isRequired,
    getApi: PropTypes.func.isRequired,
    isFeatureActive: PropTypes.func.isRequired,
    isFeatureInstalled: PropTypes.func.isRequired,
    isLazyFeature: PropTypes.func.isRequired,
    installFeatures: PropTypes.func.isRequired,
    uninstallFeatures: PropTypes.func.isRequired,
    log: PropTypes.object
};

export interface FeatureContextWithApi extends FeatureContext {
    getApi<TApi>(key: SlotKey<TApi>): TApi
    getStore<TState>(): ScopedStore<TState>
    isFeatureActive(name: string): boolean
    installFeatures(features: AnyFeature[], activation?: FeatureActivationPredicate): void
    uninstallFeatures(names: string[]): void
}

interface WrapperMembers<S, OP, SP, DP> {
    connectedComponent: any;
    mapStateToProps: (state: S, ownProps?: OP) => SP;
    mapDispatchToProps: (dispatch: Dispatch<Action>, ownProps?: OP) => DP;
}

function wrapWithFeatureContext<S, OP, SP, DP>(
    component: React.ComponentType<SP & DP>,
    mapStateToProps: (context: FeatureContextWithApi, state: S, ownProps?: OP) => SP,
    mapDispatchToProps: (context: FeatureContextWithApi, dispatch: Dispatch<Action>, ownProps?: OP) => DP)
{
    return class ConnectedComponent
        extends React.Component<OP>
        implements WrapperMembers<S, OP, SP, DP>
    {
        connectedComponent: ConnectedComponentClass<ComponentType<never>, OP>;
        mapStateToProps: (state: S, ownProps?: OP) => SP;
        mapDispatchToProps: (dispatch: Dispatch<Action>, ownProps?: OP) => DP;

        constructor(props: OP, context: FeatureContextWithApi) {
            super(props, context);

            this.mapStateToProps = mapStateToProps
                ? (_, ownProps) => mapStateToProps(context, context.getStore<S>().getState(), ownProps)
                : () => ({} as SP);
            this.mapDispatchToProps = mapDispatchToProps
                ? (dispatch, ownProps) => mapDispatchToProps(context, dispatch, ownProps)
                : () => ({} as DP);
            this.connectedComponent = reduxConnect<SP, DP, OP, S>(
                this.mapStateToProps,
                this.mapDispatchToProps)(component as any) as any;

            (this as any).shouldComponentUpdate = (this.connectedComponent as any).shouldComponentUpdate;
        }

        render() {
            const Component = this.connectedComponent;
            return <Component {...this.props} />;
        }

        static contextTypes = featureContextTypes;
    };

}

export function connectWithFeature<S, OP, SP, DP>(
    mapStateToProps: (context: FeatureContextWithApi, state: S, ownProps?: OP) => SP,
    mapDispatchToProps: (context: FeatureContextWithApi, dispatch: Dispatch<Action>, ownProps?: OP) => DP)
{
    return (component: React.ComponentType<SP & DP>) => {
        return wrapWithFeatureContext(
            component,
            mapStateToProps,
            mapDispatchToProps
        );
    };
}
