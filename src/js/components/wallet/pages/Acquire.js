/* @flow */


import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { Notification } from '~/js/components/common/Notification';
import * as TrezorConnectActions from '~/js/actions/TrezorConnectActions';

import type { State, Dispatch } from '~/flowtype';

type Props = {
    acquiring: boolean;
    acquireDevice: typeof TrezorConnectActions.acquire
}

const Acquire = (props: Props) => {
    const actions = props.acquiring ? [] : [
        {
            label: 'Acquire device',
            callback: () => {
                props.acquireDevice();
            },
        },
    ];
    const acquireDeviceAction = {
        label: 'Acquire device',
        callback: () => {
            props.acquireDevice()
        }
    };

    return (
        <section className="acquire">
            {props.acquiring ? (
                <Notification
                    title="Device is being acquired"
                    message="Please wait"
                    className="loading"
                    cancelable={false}
                    loading={true}
                />
            ) : (
                <Notification
                    title="Device is used in other window"
                    message="Do you want to use your device in this window?"
                    className="info"
                    cancelable={ false }
                    actions={ [acquireDeviceAction] }
                />
            )}
        </section>
    );
};

export default connect(
    (state: State) => ({
        acquiring: state.connect.acquiring,
    }),
    (dispatch: Dispatch) => ({
        acquireDevice: bindActionCreators(TrezorConnectActions.acquire, dispatch),
    }),
)(Acquire);
